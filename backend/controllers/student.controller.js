import Course from "../models/Course.js"
import Section from "../models/Section.js"
import Assessment from "../models/Assessment.js"
import Attendance from "../models/Attendance.js"
import Marks from "../models/Marks.js"
import Enrollment from "../models/Enrollment.js"
import Student from "../models/Student.js"
import Institute from "../models/Institute.js"
import mongoose from "mongoose"

//View Courses
const readCourses = async (req, res) => {
    try {
        const student = await Student.findOne({
            institute: req.user.institute,
            _id: req.user.id
        }).select("sem").lean();

        const enrolled = await Enrollment.find({
            student: req.user.id,
            institute: req.user.institute
        }).select("course");

        const enrolledIds = enrolled.map(e => e.course);

        const filter = {
            institute: req.user.institute,
            semester: student.sem,
            _id: { $nin: enrolledIds }
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {
            const courses = await Course.find(filter)
                .populate("department", "name code")
                .lean();

            return res.status(200).json({
                success: true,
                data: courses
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Course.countDocuments(filter);

        const courses = await Course.find(filter)
            .populate("department", "name code")
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Enroll in Course
const enroll = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { courseId } = req.params;

        if (!courseId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Course ID is required"
            });
        }

        const studentId = req.user.id;
        const instituteId = req.user.institute;
        const academicYear = "2025-26"; // Will be centralised later

        //Check if already enrolled in this course
        const alreadyEnrolled = await Enrollment.findOne({
            student: studentId,
            institute: instituteId
        }).populate({
            path: "section",
            match: { course: courseId }
        });

        if (alreadyEnrolled && alreadyEnrolled.section) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Already enrolled in this course"
            });
        }

        //Find first available section (Alphabetical order)
        const section = await Section.findOneAndUpdate(
            {
                course: courseId,
                academicYear,
                $expr: { $lt: ["$currentStrength", "$capacity"] }
            },
            { $inc: { currentStrength: 1 } },
            {
                sort: { sectionName: 1 }, // A → B → C
                new: true,
                session
            }
        );

        if (!section) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "All sections are full"
            });
        }

        //Create enrollment
        await Enrollment.create([{
            student: studentId,
            course: courseId,
            section: section._id,
            institute: instituteId,
            academicYear
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Enrollment successful",
            assignedSection: section.sectionName
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ Enrolled Courses
const MyCourses = async (req, res) => {
    try {
        const studentId = req.user.id;
        const instituteId = req.user.institute;

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // BASE QUERY
        // =============================
        const baseQuery = Enrollment.find({
            student: studentId,
            institute: instituteId
        }).populate({
            path: "section",
            select: "sectionName academicYear teacher course",
            populate: [
                {
                    path: "teacher",
                    select: "firstName lastName"
                },
                {
                    path: "course",
                    select: "name code department credits",
                    populate: {
                        path: "department",
                        select: "name code"
                    }
                }
            ]
        });

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {

            const enrollments = await baseQuery.lean();

            const formatted = enrollments.map(enroll => ({
                enrollmentId: enroll._id,
                course: {
                    id: enroll.section.course._id,
                    name: enroll.section.course.name,
                    code: enroll.section.course.code,
                    credits: enroll.section.course.credits,
                    department: {
                        name: enroll.section.course.department.name,
                        code: enroll.section.course.department.code
                    }
                },
                section: {
                    id: enroll.section._id,
                    name: enroll.section.sectionName,
                    academicYear: enroll.section.academicYear
                },
                teacher: {
                    id: enroll.section.teacher._id,
                    firstName: enroll.section.teacher.firstName,
                    lastName: enroll.section.teacher.lastName
                }
            }));

            return res.status(200).json({
                success: true,
                count: formatted.length,
                data: formatted
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Enrollment.countDocuments({
            student: studentId,
            institute: instituteId
        });

        const enrollments = await baseQuery
            .skip(skip)
            .limit(limit)
            .lean();

        const formatted = enrollments.map(enroll => ({
            enrollmentId: enroll._id,
            course: {
                id: enroll.section.course._id,
                name: enroll.section.course.name,
                code: enroll.section.course.code,
                credits: enroll.section.course.credits,
                department: {
                    name: enroll.section.course.department.name,
                    code: enroll.section.course.department.code
                }
            },
            section: {
                id: enroll.section._id,
                name: enroll.section.sectionName,
                academicYear: enroll.section.academicYear
            },
            teacher: {
                id: enroll.section.teacher._id,
                firstName: enroll.section.teacher.firstName,
                lastName: enroll.section.teacher.lastName
            }
        }));

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Marks By Course
const getMarksByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const instituteId = req.user.institute;

        //Find student's enrollment for this course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            institute: instituteId,
            course: courseId
        }).populate({ path: "section" });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Not enrolled in this course"
            });
        }

        const sectionId = enrollment.section._id;

        //Get all assessments of this section
        const assessments = await Assessment.find({
            institute: instituteId,
            section: sectionId
        }).select("_id title type totalMarks date");

        const assessmentIds = assessments.map(a => a._id);

        //Get marks for those assessments
        const marks = await Marks.find({
            institute: instituteId,
            student: studentId,
            assessment: { $in: assessmentIds }
        }).lean();

        //Merge assessment + marks
        const formatted = assessments.map(assessment => {
            const mark = marks.find(m =>
                m.assessment.toString() === assessment._id.toString()
            );

            return {
                assessmentId: assessment._id,
                title: assessment.title,
                type: assessment.type,
                maxMarks: assessment.totalMarks,
                date: assessment.date,
                marksObtained: mark ? mark.marksObtained : null
            };
        });

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


//Attendance 
const getAttendanceByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const instituteId = req.user.institute;

        //Find enrollment
        const enrollment = await Enrollment.findOne({
            student: studentId,
            institute: instituteId,
            course: courseId
        }).populate({ path: "section" });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Not enrolled in this course"
            });
        }

        const sectionId = enrollment.section._id;

        //Fetch all attendance docs for this section
        const attendanceDocs = await Attendance.find({
            institute: instituteId,
            section: sectionId
        }).select("date records").lean();

        let totalClasses = attendanceDocs.length;
        let presentCount = 0;
        let absentCount = 0;

        const records = [];

        for (const doc of attendanceDocs) {
            const record = doc.records.find(r =>
                r.student.toString() === studentId
            );

            if (record) {
                if (record.status === "present") presentCount++;
                if (record.status === "absent") absentCount++;

                records.push({
                    date: doc.date,
                    status: record.status
                });
            }
        }

        const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            summary: {
                totalClasses,
                present: presentCount,
                absent: absentCount,
                attendancePercentage: Number(percentage)
            },
            records
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           Profile
//----------------------------------------

//READ Profile
const readProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)

        if (!student) {
            return res.status(404).json({ success: false, message: "student not found" });
        }

        res.status(200).json({ success: true, data: student });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// UPDATE Profile
const updateProfile = async (req, res) => {
    try {
        const studentId = req.user.id; // from auth middleware
        const { firstName, lastName, phone, gender, dateOfBirth } = req.body;

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: "student not found" });
        }

        // Update student fields if provided
        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;
        if (phone) student.phone = phone;
        if (gender) student.gender = gender;
        if (dateOfBirth) student.dateOfBirth = dateOfBirth;

        await student.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            body: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new password are required" });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ success: false, message: "student not found" });
        }

        const isMatch = await student.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        if (currentPassword == newPassword) {
            return res.status(400).json({ success: false, message: "Current Password and New Password cannot be same" })
        }

        student.password = newPassword;
        student.mustChangePassword = false;
        await student.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//Analytics Course wise
// GET /api/student/courses/:courseId/course-analytics
 
// ─────────────────────────────────────────────────────────────
//  Weighted grade calculator
//
//  Algorithm:
//   1. Group all assessments by type (Assignment/Quiz/Midterm/Final).
//   2. For each type where the student has ≥1 graded assessment:
//        avgPctForType = mean( marksObtained / totalMarks * 100 )
//        weightedContrib = avgPctForType * (weightage[type] / 100)
//   3. partialGrade = Σ weightedContrib across graded types
//   4. coveredWeightage = Σ weightage of graded types
//   5. isFullGrade = has ≥1 graded Midterm AND ≥1 graded Final
//   6. finalGrade = partialGrade when isFullGrade, else null
// ─────────────────────────────────────────────────────────────
function computeWeightedGrade(assessments, myMarksMap, weightage) {
  // Build per-type stats
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
 
  let partialGrade      = 0;
  let coveredWeightage  = 0;
  let remainingWeightage = 0;
 
  const ALL_TYPES = ["Assignment", "Quiz", "Midterm", "Final"];
  const typeContributions = [];
 
  for (const type of ALL_TYPES) {
    const w      = weightage[type] ?? 0;
    const bucket = buckets[type];
 
    if (!bucket || bucket.gradedCount === 0) {
      remainingWeightage += w;
      typeContributions.push({
        type,
        weightage:        w,
        avgPct:           null,
        weightedScore:    null,
        maxWeightedScore: w,
        graded:           0,
        total:            bucket?.totalCount ?? 0,
        // "pending" → assessments exist but none graded yet
        // "none"    → no assessments of this type
        status: bucket && bucket.totalCount > 0 ? "pending" : "none",
      });
    } else {
      const avgPct       = bucket.sumPct / bucket.gradedCount;
      const weightedScore = (avgPct / 100) * w;
      partialGrade      += weightedScore;
      coveredWeightage  += w;
      typeContributions.push({
        type,
        weightage:        w,
        avgPct:           Math.round(avgPct * 10) / 10,
        weightedScore:    Math.round(weightedScore * 10) / 10,
        maxWeightedScore: w,
        graded:           bucket.gradedCount,
        total:            bucket.totalCount,
        status:           "graded",
      });
    }
  }
 
  const hasMidterm  = (buckets["Midterm"]?.gradedCount ?? 0) > 0;
  const hasFinal    = (buckets["Final"]?.gradedCount   ?? 0) > 0;
  const isFullGrade = hasMidterm && hasFinal;
 
  return {
    isFullGrade,
    finalGrade:          isFullGrade ? Math.round(partialGrade * 10) / 10 : null,
    partialGrade:        Math.round(partialGrade * 10) / 10,
    coveredWeightage,
    remainingWeightage,
    typeContributions,
    // which mandatory types are still missing
    missingFor: [
      ...(!hasMidterm ? ["Midterm"] : []),
      ...(!hasFinal   ? ["Final"]   : []),
    ],
  };
}
 
// ─────────────────────────────────────────────────────────────
//  GET /api/student/courses/:courseId/course-analytics
// ─────────────────────────────────────────────────────────────
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId   = new mongoose.Types.ObjectId(req.user.id);
    const instituteId = new mongoose.Types.ObjectId(req.user.institute);
    const courseObjId = new mongoose.Types.ObjectId(courseId);
 
    // ── 1. Fetch institute academic policy ────────────────────
    const institute = await Institute.findById(instituteId)
      .select("academicPolicy")
      .lean();
 
    const policy             = institute?.academicPolicy ?? {};
    const weightage          = {
      Assignment: policy.assessmentWeightage?.Assignment ?? 10,
      Quiz:       policy.assessmentWeightage?.Quiz       ?? 10,
      Midterm:    policy.assessmentWeightage?.Midterm    ?? 30,
      Final:      policy.assessmentWeightage?.Final      ?? 50,
    };
    const attendanceThreshold = policy.attendanceThreshold ?? 75;
    const passingMarks        = policy.passingMarks        ?? 40;
 
    // ── 2. Student's enrollment ───────────────────────────────
    const enrollment = await Enrollment.findOne({
      student: studentId, institute: instituteId, course: courseObjId,
    })
      .populate({
        path: "section",
        select: "sectionName currentStrength",
        populate: { path: "course", select: "name code credits semester" },
      })
      .lean();
 
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Not enrolled in this course" });
    }
 
    const sectionId  = enrollment.section._id;
    const courseInfo = {
      name:          enrollment.section.course?.name,
      code:          enrollment.section.course?.code,
      credits:       enrollment.section.course?.credits,
      semester:      enrollment.section.course?.semester,
      section:       enrollment.section.sectionName,
      totalStudents: enrollment.section.currentStrength,
    };
 
    // ── 3. All assessments for this section ───────────────────
    const assessments = await Assessment.find({
      institute: instituteId, section: sectionId,
    })
      .sort({ date: 1 })
      .lean();
 
    // No assessments created at all
    if (assessments.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          courseInfo,
          policy: { weightage, attendanceThreshold, passingMarks },
          hasData: false,
          gradeCard: null,
          assessmentComparison: [],
          typeBreakdown: [],
          attendanceSummary: { total: 0, present: 0, absent: 0, percentage: 0, currentStreak: 0, longestStreak: 0, records: [] },
          insights: [],
          performanceTrend: [],
        },
      });
    }
 
    const assessmentIds = assessments.map((a) => a._id);
 
    // ── 4. Student marks ──────────────────────────────────────
    const myMarksDocs = await Marks.find({
      institute: instituteId, student: studentId,
      assessment: { $in: assessmentIds },
    }).lean();
 
    const myMarksMap = Object.fromEntries(
      myMarksDocs.map((m) => [m.assessment.toString(), m.marksObtained])
    );
 
    // ── 5. Class-wide marks for comparison ───────────────────
    const classMarksDocs = await Marks.find({
      institute: instituteId,
      assessment: { $in: assessmentIds },
    }).lean();
 
    const classMarksByAssessment = {};
    for (const m of classMarksDocs) {
      const key = m.assessment.toString();
      if (!classMarksByAssessment[key]) classMarksByAssessment[key] = [];
      classMarksByAssessment[key].push({ studentId: m.student.toString(), marks: m.marksObtained });
    }
 
    // ── 6. Per-assessment comparison rows ─────────────────────
    const assessmentComparison = assessments.map((a) => {
      const key      = a._id.toString();
      const classArr = classMarksByAssessment[key] || [];
      const myScore  = myMarksMap[key] ?? null;
 
      const classScores = classArr.map((x) => x.marks);
      const classAvg   = classScores.length > 0
        ? Math.round((classScores.reduce((s, v) => s + v, 0) / classScores.length) * 10) / 10
        : null;
      const classHigh  = classScores.length > 0 ? Math.max(...classScores) : null;
      const classLow   = classScores.length > 0 ? Math.min(...classScores) : null;
 
      let rank        = null;
      const totalRanked = classArr.length;
      if (myScore !== null && classArr.length > 0) {
        rank = classArr.filter((x) => x.marks > myScore).length + 1;
      }
 
      const myPct   = myScore   !== null ? Math.round((myScore   / a.totalMarks) * 100) : null;
      const avgPct  = classAvg  !== null ? Math.round((classAvg  / a.totalMarks) * 100) : null;
      const highPct = classHigh !== null ? Math.round((classHigh / a.totalMarks) * 100) : null;
 
      // How many weighted points does this assessment contribute towards final grade?
      // (typeWeight / 100) gives the weight fraction for this type.
      // If a type has multiple assessments, the final contribution is spread equally.
      const typeWeight = weightage[a.type] ?? 0;
      const typeCount  = assessments.filter((x) => x.type === a.type).length;
      const thisAssessmentWeightShare = typeCount > 0 ? typeWeight / typeCount : 0;
 
      // Weighted contribution of this single assessment towards final grade
      const myWeightedContrib = myPct !== null
        ? Math.round((myPct / 100) * thisAssessmentWeightShare * 10) / 10
        : null;
      const maxWeightedContrib = Math.round(thisAssessmentWeightShare * 10) / 10;
 
      return {
        assessmentId:     a._id,
        title:            a.title,
        type:             a.type,
        date:             a.date,
        totalMarks:       a.totalMarks,
        typeWeight,
        thisAssessmentWeightShare: Math.round(thisAssessmentWeightShare * 10) / 10,
        myScore,
        myPct,
        myWeightedContrib,
        maxWeightedContrib,
        classAvg,
        avgPct,
        classHigh,
        classLow,
        highPct,
        rank,
        totalRanked,
      };
    });
 
    // ── 7. Weighted grade card ────────────────────────────────
    const gradeCard = computeWeightedGrade(assessments, myMarksMap, weightage);
 
    // Annotate with pass/fail and best-case projections
    if (gradeCard.isFullGrade) {
      gradeCard.isPassing    = gradeCard.finalGrade >= passingMarks;
      gradeCard.passingMarks = passingMarks;
    } else {
      const bestCase               = gradeCard.partialGrade + gradeCard.remainingWeightage;
      gradeCard.bestCaseGrade      = Math.round(bestCase * 10) / 10;
      gradeCard.passingMarks       = passingMarks;
      // Can they still pass even scoring 0 on remaining?
      gradeCard.canStillPass       = gradeCard.partialGrade >= passingMarks;
      // Can they pass if they score 100% on remaining?
      gradeCard.canPassIfPerfect   = bestCase >= passingMarks;
    }
 
    // ── 8. Type breakdown (student perspective) ───────────────
    const typeMap = {};
    for (const a of assessments) {
      const t     = a.type;
      const score = myMarksMap[a._id.toString()];
      if (!typeMap[t]) typeMap[t] = { count: 0, totalPct: 0, given: 0, weightage: weightage[t] ?? 0 };
      typeMap[t].count++;
      if (score !== undefined) {
        typeMap[t].totalPct += (score / a.totalMarks) * 100;
        typeMap[t].given++;
      }
    }
    const typeBreakdown = Object.entries(typeMap).map(([type, data]) => ({
      type,
      count:    data.count,
      given:    data.given,
      weightage: data.weightage,
      avgPct:   data.given > 0 ? Math.round(data.totalPct / data.given) : null,
    }));
 
    // ── 9. Attendance ─────────────────────────────────────────
    const attendanceDocs = await Attendance.find({
      institute: instituteId, section: sectionId,
    })
      .sort({ date: 1 })
      .lean();
 
    let presentCount = 0, absentCount = 0;
    const attendanceRecords = [];
    for (const doc of attendanceDocs) {
      const record = doc.records.find(
        (r) => r.student.toString() === studentId.toString()
      );
      if (record) {
        if (record.status === "present") presentCount++;
        else absentCount++;
        attendanceRecords.push({ date: doc.date, status: record.status });
      }
    }
    const totalClasses  = presentCount + absentCount;
    const attendancePct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
 
    // Streak
    let longestStreak = 0, tempStreak = 0;
    for (const r of attendanceRecords) {
      if (r.status === "present") { tempStreak++; if (tempStreak > longestStreak) longestStreak = tempStreak; }
      else tempStreak = 0;
    }
    let currentStreak = 0;
    for (let i = attendanceRecords.length - 1; i >= 0; i--) {
      if (attendanceRecords[i].status === "present") currentStreak++;
      else break;
    }
 
    // ── 10. Performance trend ─────────────────────────────────
    const gradedAssessments = assessmentComparison.filter((a) => a.myScore !== null);
    const performanceTrend  = gradedAssessments.map((a, i) => {
      const window     = gradedAssessments.slice(Math.max(0, i - 2), i + 1);
      const rollingAvg = Math.round(window.reduce((s, w) => s + w.myPct, 0) / window.length);
      return {
        title:      a.title.length > 14 ? a.title.substring(0, 12) + "…" : a.title,
        myPct:      a.myPct,
        avgPct:     a.avgPct,
        rollingAvg,
        date:       a.date,
      };
    });
 
    // ── 11. Insights (policy-aware) ───────────────────────────
    const insights = [];
    const gradedCount = gradedAssessments.length;
 
    if (gradedCount > 0) {
      // Grade insight
      if (gradeCard.isFullGrade) {
        const g = gradeCard.finalGrade;
        if (!gradeCard.isPassing)
          insights.push({ type: "warning", text: `Final grade ${g}% is below the passing mark of ${passingMarks}%.` });
        else if (g >= 85)
          insights.push({ type: "positive", text: `Excellent final grade of ${g}% — well above the passing mark of ${passingMarks}%.` });
        else
          insights.push({ type: "neutral",  text: `Grade ${g}% — passing (threshold ${passingMarks}%).` });
      } else {
        const missing = gradeCard.missingFor.join(" & ");
        if (!gradeCard.canPassIfPerfect)
          insights.push({ type: "warning",  text: `Even with a perfect score on remaining assessments, max grade is ${gradeCard.bestCaseGrade}% — below passing mark of ${passingMarks}%.` });
        else
          insights.push({ type: "neutral",  text: `Partial grade ${gradeCard.partialGrade}% from ${gradeCard.coveredWeightage}% of the course. Grade finalises after ${missing} is graded.` });
      }
 
      // Best/worst assessment
      const sorted = [...gradedAssessments].sort((a, b) => b.myPct - a.myPct);
      insights.push({
        type: "info",
        text: `Best: ${sorted[0].title} (${sorted[0].myPct}%)${
          sorted.length > 1 ? ` · Needs work: ${sorted[sorted.length - 1].title} (${sorted[sorted.length - 1].myPct}%)` : ""
        }`,
      });
 
      // Trend
      if (gradedCount >= 3) {
        const half     = Math.ceil(gradedCount / 2);
        const tail     = gradedCount - Math.floor(gradedCount / 2);
        const firstAvg = gradedAssessments.slice(0, half).reduce((s, a) => s + a.myPct, 0) / half;
        const lastAvg  = gradedAssessments.slice(Math.floor(gradedCount / 2)).reduce((s, a) => s + a.myPct, 0) / tail;
        const diff     = Math.round(lastAvg - firstAvg);
        if (diff >= 5)       insights.push({ type: "positive", text: `Improving trend — up ${diff}% in recent assessments.` });
        else if (diff <= -5) insights.push({ type: "warning",  text: `Declining trend — down ${Math.abs(diff)}% in recent assessments.` });
        else                 insights.push({ type: "neutral",  text: "Consistent performance — no major trend." });
      }
 
      // Beat class avg
      const withAvg  = gradedAssessments.filter((a) => a.avgPct !== null);
      const beatsAvg = withAvg.filter((a) => a.myPct > a.avgPct).length;
      if (withAvg.length > 0)
        insights.push({
          type: beatsAvg >= withAvg.length / 2 ? "positive" : "neutral",
          text: `Beat the class average in ${beatsAvg} of ${withAvg.length} graded assessments.`,
        });
    }
 
    // Attendance insight — use policy threshold
    if (totalClasses > 0) {
      if (attendancePct < attendanceThreshold)
        insights.push({
          type: "warning",
          text: `Attendance ${attendancePct}% is below the required ${attendanceThreshold}%. Risk of exam ineligibility.`,
        });
      else
        insights.push({
          type: "positive",
          text: `Good attendance: ${attendancePct}% (${presentCount}/${totalClasses}) — above the ${attendanceThreshold}% threshold.`,
        });
    }
 
    if (longestStreak >= 5)
      insights.push({ type: "positive", text: `Longest attendance streak: ${longestStreak} consecutive classes.` });
 
    // ── 12. Final response ────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        courseInfo,
        policy: { weightage, attendanceThreshold, passingMarks },
        hasData: true,
        gradeCard,
        assessmentComparison,
        typeBreakdown,
        attendanceSummary: {
          total: totalClasses, present: presentCount, absent: absentCount,
          percentage: attendancePct, currentStreak, longestStreak,
          records: attendanceRecords,
        },
        performanceTrend,
        insights,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
    //Courses
    readCourses,
    enroll,
    MyCourses,
    getAttendanceByCourse,
    getMarksByCourse,

    //Profile
    readProfile,
    updateProfile,
    changePassword,

    //Analytics
    getCourseAnalytics,
}