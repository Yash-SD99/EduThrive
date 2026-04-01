// ─────────────────────────────────────────────────────────────
//  One endpoint per role.  Each handler:
//   1. Fetches the same analytics data its dashboard already uses
//      (no duplicate DB query patterns — we re-run the cheapest
//      subset of queries needed to feed the rule engine).
//   2. Passes the result to the pure alertEngine functions.
//   3. Returns the alert array.
//
//  Routes (add to each role's existing router):
//    GET /api/student/alerts         → studentAlerts
//    GET /api/teacher/alerts         → teacherAlerts
//    GET /api/hod/alerts             → hodAlerts
//    GET /api/director/alerts        → directorAlerts
// ─────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import Institute  from "../models/Institute.js";
import Teacher    from "../models/Teacher.js";
import Section    from "../models/Section.js";
import Enrollment from "../models/Enrollment.js";
import Assessment from "../models/Assessment.js";
import Marks      from "../models/Marks.js";
import Attendance from "../models/Attendance.js";
import Course     from "../models/Course.js";
import Department from "../models/Department.js";

import {
  generateStudentAlerts,
  generateTeacherAlerts,
  generateHodAlerts,
  generateDirectorAlerts,
} from "../alertEngine.js";

// ── Shared policy fetcher ──────────────────────────────────────
async function fetchPolicy(instituteId) {
  const inst = await Institute.findById(instituteId).select("academicPolicy").lean();
  const p    = inst?.academicPolicy ?? {};
  return {
    weightage: {
      Assignment: p.assessmentWeightage?.Assignment ?? 10,
      Quiz:       p.assessmentWeightage?.Quiz       ?? 10,
      Midterm:    p.assessmentWeightage?.Midterm    ?? 30,
      Final:      p.assessmentWeightage?.Final      ?? 50,
    },
    attendanceThreshold: p.attendanceThreshold ?? 75,
    passingMarks:        p.passingMarks        ?? 40,
  };
}

// ── Weighted grade helper (mirrors courseAnalytics logic) ──────
function computeWeightedGrade(assessments, myMarksMap, weightage) {
  const buckets = {};
  for (const a of assessments) {
    const t = a.type;
    if (!buckets[t]) buckets[t] = { sumPct: 0, gradedCount: 0, totalCount: 0 };
    buckets[t].totalCount++;
    const score = myMarksMap[a._id.toString()];
    if (score !== undefined) {
      buckets[t].sumPct += (score / a.totalMarks) * 100;
      buckets[t].gradedCount++;
    }
  }

  let partialGrade = 0, coveredWeightage = 0, remainingWeightage = 0;
  for (const type of ["Assignment", "Quiz", "Midterm", "Final"]) {
    const w = weightage[type] ?? 0;
    const b = buckets[type];
    if (!b || b.gradedCount === 0) { remainingWeightage += w; }
    else {
      const avg = b.sumPct / b.gradedCount;
      partialGrade     += (avg / 100) * w;
      coveredWeightage += w;
    }
  }

  const hasMidterm  = (buckets["Midterm"]?.gradedCount ?? 0) > 0;
  const hasFinal    = (buckets["Final"]?.gradedCount   ?? 0) > 0;
  const isFullGrade = hasMidterm && hasFinal;

  return { isFullGrade, partialGrade: Math.round(partialGrade * 10) / 10,
    finalGrade: isFullGrade ? Math.round(partialGrade * 10) / 10 : null,
    coveredWeightage, remainingWeightage,
    bestCaseGrade: Math.round((partialGrade + remainingWeightage) * 10) / 10,
    canPassIfPerfect: (partialGrade + remainingWeightage) >= 40,
    missingFor: [...(!hasMidterm ? ["Midterm"] : []), ...(!hasFinal ? ["Final"] : [])],
  };
}

// ─────────────────────────────────────────────────────────────
//  STUDENT ALERTS
//  Aggregates alerts across ALL enrolled courses, deduplicates
//  by severity and returns the top-7 most urgent.
// ─────────────────────────────────────────────────────────────
export const studentAlerts = async (req, res) => {
  try {
    const studentId   = new mongoose.Types.ObjectId(req.user.id);
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const policy      = await fetchPolicy(instituteId);

    // All enrollments
    const enrollments = await Enrollment.find({ student: studentId, institute: instituteId })
      .populate({ path: "section", select: "sectionName currentStrength",
                  populate: { path: "course", select: "name code" } })
      .lean();

    const allAlerts = [];

    for (const enroll of enrollments) {
      const sectionId   = enroll.section._id;
      const courseName  = enroll.section.course?.name ?? "Unknown";

      const assessments = await Assessment.find({ institute: instituteId, section: sectionId })
        .sort({ date: 1 }).lean();

      if (assessments.length === 0) continue;

      const assessmentIds = assessments.map((a) => a._id);

      const [myMarksDocs, classMarksDocs, attendanceDocs] = await Promise.all([
        Marks.find({ institute: instituteId, student: studentId, assessment: { $in: assessmentIds } }).lean(),
        Marks.find({ institute: instituteId, assessment: { $in: assessmentIds } }).lean(),
        Attendance.find({ institute: instituteId, section: sectionId }).sort({ date: 1 }).lean(),
      ]);

      const myMarksMap = Object.fromEntries(
        myMarksDocs.map((m) => [m.assessment.toString(), m.marksObtained])
      );

      // Class marks grouped by assessment
      const classByAssessment = {};
      for (const m of classMarksDocs) {
        const k = m.assessment.toString();
        if (!classByAssessment[k]) classByAssessment[k] = [];
        classByAssessment[k].push({ studentId: m.student.toString(), marks: m.marksObtained });
      }

      // Assessment comparison rows (subset of shape engine expects)
      const assessmentComparison = assessments.map((a) => {
        const key      = a._id.toString();
        const classArr = classByAssessment[key] || [];
        const myScore  = myMarksMap[key] ?? null;
        const classScores = classArr.map((x) => x.marks);
        const classAvg = classScores.length > 0
          ? classScores.reduce((s, v) => s + v, 0) / classScores.length : null;
        const myPct  = myScore  !== null ? Math.round((myScore  / a.totalMarks) * 100) : null;
        const avgPct = classAvg !== null ? Math.round((classAvg / a.totalMarks) * 100) : null;
        let rank = null;
        if (myScore !== null && classArr.length > 0)
          rank = classArr.filter((x) => x.marks > myScore).length + 1;
        return {
          title: a.title, type: a.type, date: a.date, totalMarks: a.totalMarks,
          myScore, myPct, avgPct,
          highPct: classScores.length > 0 ? Math.round((Math.max(...classScores) / a.totalMarks) * 100) : null,
          rank, totalRanked: classArr.length,
        };
      });

      // Attendance
      let present = 0, absent = 0;
      for (const doc of attendanceDocs) {
        const r = doc.records.find((x) => x.student.toString() === studentId.toString());
        if (r) { r.status === "present" ? present++ : absent++; }
      }
      const totalCls  = present + absent;
      const attPct    = totalCls > 0 ? Math.round((present / totalCls) * 100) : 0;

      // Trend array (chronological graded items)
      const graded = assessmentComparison.filter((a) => a.myPct !== null);
      const performanceTrend = graded.map((a) => ({
        title: a.title, myPct: a.myPct, avgPct: a.avgPct,
      }));

      // Grade card
      const gradeCard = computeWeightedGrade(assessments, myMarksMap, policy.weightage);
      if (gradeCard.isFullGrade) {
        gradeCard.isPassing    = gradeCard.finalGrade >= policy.passingMarks;
        gradeCard.passingMarks = policy.passingMarks;
      } else {
        gradeCard.passingMarks = policy.passingMarks;
      }

      // Build data shape the engine expects
      const courseData = {
        policy,
        gradeCard,
        assessmentComparison,
        attendanceSummary: { percentage: attPct, total: totalCls, present, absent: absent },
        performanceTrend,
        courseInfo: { name: courseName },
      };

      // Generate alerts and tag them with course name
      const courseAlerts = generateStudentAlerts(courseData).map((a) => ({
        ...a,
        course: courseName,
        message: `[${courseName}] ${a.message}`,
      }));

      allAlerts.push(...courseAlerts);
    }

    // Sort by severity and cap
    const LEVEL_ORDER = { critical: 0, warning: 1, insight: 2, positive: 3 };
    const sorted = allAlerts
      .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
      .slice(0, 7);

    res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  TEACHER ALERTS
// ─────────────────────────────────────────────────────────────
export const teacherAlerts = async (req, res) => {
  try {
    const teacherId   = new mongoose.Types.ObjectId(req.user.id);
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const policy      = await fetchPolicy(instituteId);

    const sections = await Section.find({ institute: instituteId, teacher: teacherId })
      .populate("course", "name code").lean();

    const sectionIds = sections.map((s) => s._id);
    if (sectionIds.length === 0)
      return res.status(200).json({ success: true, data: [] });

    // Attendance per section
    const attendanceRaw = await Attendance.aggregate([
      { $match: { institute: instituteId, section: { $in: sectionIds } } },
      { $unwind: "$records" },
      { $group: {
          _id: "$section",
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
      }},
    ]);

    const sectionNameMap = Object.fromEntries(
      sections.map((s) => [s._id.toString(), `${s.course?.name} - ${s.sectionName}`])
    );

    const attendancePerSection = attendanceRaw.map((a) => ({
      name:       sectionNameMap[a._id.toString()] || "Unknown",
      percentage: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
    }));

    const avgAtt = attendancePerSection.length > 0
      ? Math.round(attendancePerSection.reduce((s, a) => s + a.percentage, 0) / attendancePerSection.length)
      : 0;

    // Recent assessments avg score %
    const recentAssessments = await Assessment.find({
      institute: instituteId, section: { $in: sectionIds },
    }).sort({ date: -1 }).limit(8).lean();

    const aIds = recentAssessments.map((a) => a._id);
    const marksRaw = await Marks.aggregate([
      { $match: { institute: instituteId, assessment: { $in: aIds } } },
      { $group: { _id: "$assessment", avg: { $avg: "$marksObtained" }, count: { $sum: 1 } } },
    ]);

    const marksMap2 = Object.fromEntries(marksRaw.map((m) => [m._id.toString(), m]));
    const avgMarksPerAssessment = recentAssessments
      .filter((a) => marksMap2[a._id.toString()])
      .map((a) => {
        const m = marksMap2[a._id.toString()];
        return {
          title: a.title,
          avg:   Math.round((m.avg / a.totalMarks) * 100),
          count: m.count,
        };
      })
      .reverse();

    const sectionCapacityUsage = sections.map((s) => ({
      name:       `${s.course?.name} - ${s.sectionName}`,
      capacity:   s.capacity,
      enrolled:   s.currentStrength,
      percentage: Math.round((s.currentStrength / s.capacity) * 100),
    }));

    const teacherData = {
      summary: { avgAttendance: avgAtt, totalSections: sections.length },
      attendancePerSection,
      avgMarksPerAssessment,
      sectionCapacityUsage,
    };

    const alerts = generateTeacherAlerts(teacherData, policy);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  HOD ALERTS
// ─────────────────────────────────────────────────────────────
export const hodAlerts = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const teacherId   = req.user.id;
    const policy      = await fetchPolicy(instituteId);

    const hod = await Teacher.findById(teacherId).select("department").lean();
    if (!hod) return res.status(404).json({ success: false, message: "HOD not found" });

    const departmentId = new mongoose.Types.ObjectId(hod.department);

    // Courses in dept
    const courses = await Course.find({ institute: instituteId, department: departmentId }).lean();
    const courseIds = courses.map((c) => c._id);

    // Sections for these courses
    const sections = await Section.find({
      institute: instituteId, course: { $in: courseIds },
    }).lean();
    const sectionIds = sections.map((s) => s._id);

    // Attendance per course (section → course mapping)
    const secToCourse = Object.fromEntries(
      sections.map((s) => [s._id.toString(), s.course.toString()])
    );
    const courseNameMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c.name]));

    const attendanceRaw = await Attendance.aggregate([
      { $match: { institute: instituteId, section: { $in: sectionIds } } },
      { $unwind: "$records" },
      { $group: {
          _id: "$section",
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
      }},
    ]);

    // Roll up to course level
    const courseAttMap = {};
    for (const a of attendanceRaw) {
      const cId = secToCourse[a._id.toString()];
      if (!cId) continue;
      if (!courseAttMap[cId]) courseAttMap[cId] = { total: 0, present: 0 };
      courseAttMap[cId].total   += a.total;
      courseAttMap[cId].present += a.present;
    }

    const attendanceByCourse = Object.entries(courseAttMap).map(([cId, v]) => ({
      name:       courseNameMap[cId] || "Unknown",
      percentage: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
    }));

    // Avg marks per course
    const assessmentIds = (
      await Assessment.find({ institute: instituteId, section: { $in: sectionIds } })
        .select("_id section totalMarks").lean()
    );
    const aIdList = assessmentIds.map((a) => a._id);
    const aInfoMap = Object.fromEntries(assessmentIds.map((a) => [a._id.toString(), a]));

    const marksRaw = await Marks.aggregate([
      { $match: { institute: instituteId, assessment: { $in: aIdList } } },
      { $group: { _id: "$assessment", avg: { $avg: "$marksObtained" } } },
    ]);

    // Group avg score % by course
    const courseMarksBucket = {};
    for (const m of marksRaw) {
      const aInfo = aInfoMap[m._id.toString()];
      if (!aInfo) continue;
      const cId = secToCourse[aInfo.section.toString()];
      if (!cId) continue;
      if (!courseMarksBucket[cId]) courseMarksBucket[cId] = { sumPct: 0, count: 0 };
      courseMarksBucket[cId].sumPct += (m.avg / aInfo.totalMarks) * 100;
      courseMarksBucket[cId].count++;
    }

    const avgMarksByCourse = Object.entries(courseMarksBucket).map(([cId, v]) => ({
      name:     courseNameMap[cId] || "Unknown",
      avgScore: v.count > 0 ? Math.round(v.sumPct / v.count) : 0,
    }));

    const hodData = {
      summary: { totalStudents: 0, totalCourses: courses.length },
      attendanceByCourse,
      avgMarksByCourse,
    };

    const alerts = generateHodAlerts(hodData, policy);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  DIRECTOR ALERTS
// ─────────────────────────────────────────────────────────────
export const directorAlerts = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const policy      = await fetchPolicy(instituteId);

    // Institute-wide avg attendance
    const attStats = await Attendance.aggregate([
      { $match: { institute: instituteId } },
      { $unwind: "$records" },
      { $group: {
          _id: null,
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
      }},
    ]);
    const avgAttendance = attStats.length > 0
      ? Math.round((attStats[0].present / attStats[0].total) * 100)
      : 0;

    // Dept avg marks (weighted % across all marks in dept)
    const deptAvgMarks = await Marks.aggregate([
      { $match: { institute: instituteId } },
      { $lookup: { from: "assessments", localField: "assessment", foreignField: "_id", as: "a" } },
      { $unwind: "$a" },
      { $lookup: { from: "sections",    localField: "a.section",  foreignField: "_id", as: "sec" } },
      { $unwind: "$sec" },
      { $lookup: { from: "courses",     localField: "sec.course", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $lookup: { from: "departments", localField: "course.department", foreignField: "_id", as: "dept" } },
      { $unwind: "$dept" },
      { $group: {
          _id:      "$dept._id",
          name:     { $first: "$dept.name" },
          avgMarks: { $avg: { $multiply: [{ $divide: ["$marksObtained", "$a.totalMarks"] }, 100] } },
      }},
      { $sort: { avgMarks: -1 } },
    ]);

    // Monthly enrollments (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRaw = await (await import("../models/Enrollment.js")).default.aggregate([
      { $match: { institute: instituteId, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const monthlyEnrollments = months.map((m) => {
      const found = monthlyRaw.find((e) => e._id.year === m.year && e._id.month === m.month);
      return {
        label: new Date(m.year, m.month - 1).toLocaleString("default", { month: "short" }),
        count: found ? found.count : 0,
      };
    });

    const directorData = {
      avgAttendance,
      deptAvgMarks: deptAvgMarks.map((d) => ({
        name:     d.name,
        avgMarks: Math.round(d.avgMarks * 10) / 10,
      })),
      monthlyEnrollments,
    };

    const alerts = generateDirectorAlerts(directorData, policy);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};