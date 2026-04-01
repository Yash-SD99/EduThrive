import mongoose from "mongoose";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Department from "../models/Department.js";
import Course from "../models/Course.js";
import Section from "../models/Section.js";
import Enrollment from "../models/Enrollment.js";
import Assessment from "../models/Assessment.js";
import Marks from "../models/Marks.js";
import Attendance from "../models/Attendance.js";
import Institute from "../models/Institute.js";

// ============================================================
//  DIRECTOR ANALYTICS  —  institute-wide overview
// ============================================================
export const getDirectorAnalytics = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);

    // ── 1. Headline counts ──────────────────────────────────
    const [totalStudents, totalTeachers, totalDepartments, totalCourses] =
      await Promise.all([
        Student.countDocuments({ institute: instituteId }),
        Teacher.countDocuments({ institute: instituteId }),
        Department.countDocuments({ institute: instituteId }),
        Course.countDocuments({ institute: instituteId }),
      ]);

    // ── 2. Enrolment per department ─────────────────────────
    const enrollmentByDept = await Enrollment.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "sec",
        },
      },
      { $unwind: "$sec" },
      {
        $lookup: {
          from: "courses",
          localField: "sec.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $lookup: {
          from: "departments",
          localField: "course.department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $group: {
          _id: "$dept._id",
          name: { $first: "$dept.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── 3. Monthly enrolments for the last 6 months ─────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyEnrollments = await Enrollment.aggregate([
      {
        $match: {
          institute: instituteId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fill in missing months with 0
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const monthlyData = months.map((m) => {
      const found = monthlyEnrollments.find(
        (e) => e._id.year === m.year && e._id.month === m.month
      );
      return {
        label: new Date(m.year, m.month - 1).toLocaleString("default", {
          month: "short",
        }),
        count: found ? found.count : 0,
      };
    });

    // ── 4. Institute-wide average attendance ────────────────
    const attendanceStats = await Attendance.aggregate([
      { $match: { institute: instituteId } },
      { $unwind: "$records" },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
          },
        },
      },
    ]);
    const avgAttendance =
      attendanceStats.length > 0
        ? Math.round(
          (attendanceStats[0].present / attendanceStats[0].total) * 100
        )
        : 0;

    // ── 5. Dept-wise avg marks ───────────────────────────────
    const deptAvgMarks = await Marks.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "assessments",
          localField: "assessment",
          foreignField: "_id",
          as: "assessment",
        },
      },
      { $unwind: "$assessment" },
      {
        $lookup: {
          from: "sections",
          localField: "assessment.section",
          foreignField: "_id",
          as: "section",
        },
      },
      { $unwind: "$section" },
      {
        $lookup: {
          from: "courses",
          localField: "section.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $lookup: {
          from: "departments",
          localField: "course.department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $group: {
          _id: "$dept._id",
          name: { $first: "$dept.name" },
          avgMarks: { $avg: "$marksObtained" },
          totalAssessments: { $sum: 1 },
        },
      },
      { $sort: { avgMarks: -1 } },
    ]);

    // ── 6. Top courses by enrolment ──────────────────────────
    const topCourses = await Enrollment.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "sec",
        },
      },
      { $unwind: "$sec" },
      {
        $lookup: {
          from: "courses",
          localField: "sec.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: "$course._id",
          name: { $first: "$course.name" },
          code: { $first: "$course.code" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: { totalStudents, totalTeachers, totalDepartments, totalCourses },
        enrollmentByDept,
        monthlyEnrollments: monthlyData,
        avgAttendance,
        deptAvgMarks: deptAvgMarks.map((d) => ({
          name: d.name,
          avgMarks: Math.round(d.avgMarks * 10) / 10,
          totalAssessments: d.totalAssessments,
        })),
        topCourses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
//  HOD ANALYTICS  —  department-level
// ============================================================
export const getHodAnalytics = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const teacherId = req.user.id;

    // Get HOD's department
    const hod = await Teacher.findById(teacherId).select("department").lean();
    if (!hod) return res.status(404).json({ success: false, message: "HOD not found" });

    const departmentId = new mongoose.Types.ObjectId(hod.department);

    // ── 1. Headline counts for this dept ────────────────────
    const [totalCourses, totalTeachers, totalStudents, totalSections] =
      await Promise.all([
        Course.countDocuments({ institute: instituteId, department: departmentId }),
        Teacher.countDocuments({ institute: instituteId, department: departmentId }),
        Student.countDocuments({ institute: instituteId, department: departmentId }),
        Section.countDocuments({ institute: instituteId }),
      ]);

    // ── 2. Enrollment per course ─────────────────────────────
    const enrollmentPerCourse = await Enrollment.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "sec",
        },
      },
      { $unwind: "$sec" },
      {
        $lookup: {
          from: "courses",
          localField: "sec.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $match: {
          "course.department": departmentId,
        },
      },
      {
        $group: {
          _id: "$course._id",
          name: { $first: "$course.name" },
          code: { $first: "$course.code" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── 3. Avg marks per course ──────────────────────────────
    const avgMarksByCourse = await Marks.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "assessments",
          localField: "assessment",
          foreignField: "_id",
          as: "assessment",
        },
      },
      { $unwind: "$assessment" },
      {
        $lookup: {
          from: "sections",
          localField: "assessment.section",
          foreignField: "_id",
          as: "section",
        },
      },
      { $unwind: "$section" },
      {
        $lookup: {
          from: "courses",
          localField: "section.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $match: { "course.department": departmentId } },
      {
        $group: {
          _id: "$course._id",
          name: { $first: "$course.name" },
          avgScore: { $avg: "$marksObtained" },
          totalRecords: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
    ]);

    // ── 4. Attendance per course ─────────────────────────────
    const attendanceByCourse = await Attendance.aggregate([
      { $match: { institute: instituteId } },
      { $unwind: "$records" },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "sec",
        },
      },
      { $unwind: "$sec" },
      {
        $lookup: {
          from: "courses",
          localField: "sec.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $match: { "course.department": departmentId } },
      {
        $group: {
          _id: "$course._id",
          name: { $first: "$course.name" },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
          },
        },
      },
    ]);

    const attendanceFormatted = attendanceByCourse.map((c) => ({
      name: c.name,
      percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    }));

    // ── 5. Assessment type distribution ─────────────────────
    const assessmentTypes = await Assessment.aggregate([
      { $match: { institute: instituteId } },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "section",
        },
      },
      { $unwind: "$section" },
      {
        $lookup: {
          from: "courses",
          localField: "section.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $match: { "course.department": departmentId } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: { totalCourses, totalTeachers, totalStudents, totalSections },
        enrollmentPerCourse,
        avgMarksByCourse: avgMarksByCourse.map((c) => ({
          name: c.name,
          avgScore: Math.round(c.avgScore * 10) / 10,
        })),
        attendanceByCourse: attendanceFormatted,
        assessmentTypes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
//  TEACHER ANALYTICS  —  all assigned sections
// ============================================================
export const getTeacherAnalytics = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const teacherId = new mongoose.Types.ObjectId(req.user.id);

    // ── 1. Sections assigned to this teacher ────────────────
    const sections = await Section.find({
      institute: instituteId,
      teacher: teacherId,
    })
      .populate("course", "name code")
      .lean();

    const sectionIds = sections.map((s) => s._id);

    if (sectionIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalSections: 0,
            totalStudents: 0,
            totalAssessments: 0,
            avgAttendance: 0,
          },
          attendancePerSection: [],
          avgMarksPerAssessment: [],
          assessmentTypeBreakdown: [],
          sectionCapacityUsage: [],
        },
      });
    }

    // ── 2. Headline counts ───────────────────────────────────
    const [totalStudents, totalAssessments] = await Promise.all([
      Enrollment.countDocuments({ institute: instituteId, section: { $in: sectionIds } }),
      Assessment.countDocuments({ institute: instituteId, section: { $in: sectionIds } }),
    ]);

    // ── 3. Attendance % per section ──────────────────────────
    const attendanceRaw = await Attendance.aggregate([
      {
        $match: {
          institute: instituteId,
          section: { $in: sectionIds },
        },
      },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$section",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] },
          },
        },
      },
    ]);

    // Map section id → name
    const sectionMap = Object.fromEntries(
      sections.map((s) => [s._id.toString(), `${s.course?.name} - ${s.sectionName}`])
    );

    const attendancePerSection = attendanceRaw.map((a) => ({
      name: sectionMap[a._id.toString()] || "Unknown",
      percentage: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
    }));

    const avgAttendance =
      attendancePerSection.length > 0
        ? Math.round(
          attendancePerSection.reduce((sum, a) => sum + a.percentage, 0) /
          attendancePerSection.length
        )
        : 0;

    // ── 4. Avg marks per assessment (recent 8) ───────────────
    const recentAssessments = await Assessment.find({
      institute: instituteId,
      section: { $in: sectionIds },
    })
      .sort({ date: -1 })
      .limit(8)
      .lean();

    const assessmentIds = recentAssessments.map((a) => a._id);

    const marksPerAssessment = await Marks.aggregate([
      {
        $match: {
          institute: instituteId,
          assessment: { $in: assessmentIds },
        },
      },
      {
        $group: {
          _id: "$assessment",
          avg: { $avg: "$marksObtained" },
          count: { $sum: 1 },
        },
      },
    ]);

    const assessmentMap = Object.fromEntries(
      recentAssessments.map((a) => [a._id.toString(), a])
    );
    const marksMap = Object.fromEntries(
      marksPerAssessment.map((m) => [m._id.toString(), m])
    );

    const avgMarksPerAssessment = recentAssessments
      .filter((a) => marksMap[a._id.toString()])
      .map((a) => {
        const marks = marksMap[a._id.toString()];
        return {
          title: a.title.length > 20 ? a.title.substring(0, 18) + "…" : a.title,
          avg: Math.round((marks.avg / a.totalMarks) * 100),
          totalMarks: a.totalMarks,
          count: marks.count,
        };
      })
      .reverse();

    // ── 5. Assessment type breakdown ─────────────────────────
    const assessmentTypeBreakdown = await Assessment.aggregate([
      {
        $match: {
          institute: instituteId,
          section: { $in: sectionIds },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // ── 6. Section capacity usage ────────────────────────────
    const sectionCapacityUsage = sections.map((s) => ({
      name: `${s.course?.name} - ${s.sectionName}`,
      capacity: s.capacity,
      enrolled: s.currentStrength,
      percentage: Math.round((s.currentStrength / s.capacity) * 100),
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSections: sections.length,
          totalStudents,
          totalAssessments,
          avgAttendance,
        },
        attendancePerSection,
        avgMarksPerAssessment,
        assessmentTypeBreakdown,
        sectionCapacityUsage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
//  STUDENT ANALYTICS  —  personal academic performance
//  Uses institute academicPolicy for weighted grade calculation
// ============================================================
export const getStudentAnalytics = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    // ── 1. Institute academic policy ─────────────────────────
    const institute = await Institute.findById(instituteId)
      .select("academicPolicy")
      .lean();

    const policy = institute?.academicPolicy ?? {};
    const weightage = {
      Assignment: policy.assessmentWeightage?.Assignment ?? 10,
      Quiz: policy.assessmentWeightage?.Quiz ?? 10,
      Midterm: policy.assessmentWeightage?.Midterm ?? 30,
      Final: policy.assessmentWeightage?.Final ?? 50,
    };
    const attendanceThreshold = policy.attendanceThreshold ?? 75;
    const passingMarks = policy.passingMarks ?? 40;

    // ── 2. Enrolled courses ───────────────────────────────────
    const enrollments = await Enrollment.find({
      institute: instituteId,
      student: studentId,
    })
      .populate({
        path: "section",
        populate: { path: "course", select: "name code" },
      })
      .lean();

    const sectionIds = enrollments.map((e) => e.section._id);
    const totalCourses = enrollments.length;

    // ── 3. Attendance per course ──────────────────────────────
    const attendanceDocs = await Attendance.find({
      institute: instituteId,
      section: { $in: sectionIds },
      "records.student": studentId,
    }).lean();

    const attendanceBySectionId = {};
    for (const doc of attendanceDocs) {
      const secId = doc.section.toString();
      if (!attendanceBySectionId[secId]) attendanceBySectionId[secId] = { total: 0, present: 0 };
      const record = doc.records.find(
        (r) => r.student.toString() === studentId.toString()
      );
      if (record) {
        attendanceBySectionId[secId].total++;
        if (record.status === "present") attendanceBySectionId[secId].present++;
      }
    }

    const attendanceByCourse = enrollments.map((e) => {
      const secId = e.section._id.toString();
      const stats = attendanceBySectionId[secId] || { total: 0, present: 0 };
      return {
        name: e.section.course?.name || "Unknown",
        total: stats.total,
        present: stats.present,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      };
    });

    const overallAttendance = attendanceByCourse.length > 0
      ? Math.round(attendanceByCourse.reduce((s, c) => s + c.percentage, 0) / attendanceByCourse.length)
      : 0;

    // ── 4. Marks per assessment (all enrolled courses) ────────
    const assessments = await Assessment.find({
      institute: instituteId,
      section: { $in: sectionIds },
    })
      .sort({ date: 1 })
      .lean();

    const assessmentIds = assessments.map((a) => a._id);
    const marks = await Marks.find({
      institute: instituteId,
      student: studentId,
      assessment: { $in: assessmentIds },
    }).lean();

    const marksMap = Object.fromEntries(
      marks.map((m) => [m.assessment.toString(), m])
    );

    // Marks timeline for chart
    const marksTimeline = assessments
      .filter((a) => marksMap[a._id.toString()])
      .map((a) => {
        const m = marksMap[a._id.toString()];
        return {
          title: a.title.length > 18 ? a.title.substring(0, 16) + "…" : a.title,
          type: a.type,
          obtained: m.marksObtained,
          total: a.totalMarks,
          percentage: Math.round((m.marksObtained / a.totalMarks) * 100),
          date: a.date,
        };
      });

    // ── 5. Per-course weighted grade ──────────────────────────
    // Group assessments by section → course
    const sectionToEnrollment = Object.fromEntries(
      enrollments.map((e) => [e.section._id.toString(), e])
    );

    // Build per-section assessment buckets
    const sectionAssessmentMap = {};
    for (const a of assessments) {
      const secId = a.section.toString();
      if (!sectionAssessmentMap[secId]) sectionAssessmentMap[secId] = [];
      sectionAssessmentMap[secId].push(a);
    }

    // Compute weighted grade per course
    const avgScorePerCourse = [];
    for (const [secId, secAssessments] of Object.entries(sectionAssessmentMap)) {
      const enrollment = sectionToEnrollment[secId];
      if (!enrollment) continue;
      const courseName = enrollment.section.course?.name || "Unknown";

      // Build local myMarksMap for this section's assessments only
      const localMarksMap = {};
      for (const a of secAssessments) {
        const m = marksMap[a._id.toString()];
        if (m) localMarksMap[a._id.toString()] = m.marksObtained;
      }

      // Per-type averages
      const typeBuckets = {};
      for (const a of secAssessments) {
        if (!typeBuckets[a.type]) typeBuckets[a.type] = { sumPct: 0, count: 0 };
        const score = localMarksMap[a._id.toString()];
        if (score !== undefined) {
          typeBuckets[a.type].sumPct += (score / a.totalMarks) * 100;
          typeBuckets[a.type].count++;
        }
      }

      let partialGrade = 0;
      let coveredWeightage = 0;
      for (const [type, bucket] of Object.entries(typeBuckets)) {
        if (bucket.count === 0) continue;
        const avgPct = bucket.sumPct / bucket.count;
        partialGrade += (avgPct / 100) * (weightage[type] ?? 0);
        coveredWeightage += (weightage[type] ?? 0);
      }

      const hasMidterm = (typeBuckets["Midterm"]?.count ?? 0) > 0;
      const hasFinal = (typeBuckets["Final"]?.count ?? 0) > 0;
      const isFullGrade = hasMidterm && hasFinal;

      avgScorePerCourse.push({
        name: courseName,
        percentage: Math.round(partialGrade * 10) / 10,
        coveredWeightage,
        isFullGrade,
        isPassing: isFullGrade ? partialGrade >= passingMarks : null,
        assessments: secAssessments.filter((a) => localMarksMap[a._id.toString()]).length,
      });
    }

    // ── 6. Overall weighted score across all courses ──────────
    // Simple mean of per-course partial grades (for summary ring)
    const overallScore = avgScorePerCourse.length > 0
      ? Math.round(avgScorePerCourse.reduce((s, c) => s + c.percentage, 0) / avgScorePerCourse.length)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCourses,
          overallAttendance,
          overallScore,
          totalAssessmentsGiven: marks.length,
          attendanceThreshold,
          passingMarks,
        },
        attendanceByCourse,
        marksTimeline,
        avgScorePerCourse,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};