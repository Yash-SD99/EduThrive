import Course from "../models/Course.js"
import Section from "../models/Section.js"
import Assessment from "../models/Assessment.js"
import Attendance from "../models/Attendance.js"
import Marks from "../models/Marks.js"
import Enrollment from "../models/Enrollment.js"
import Student from "../models/Student.js"

//View Courses
const readCourses = async (req, res) => {
    try {
        const student = await Student.findOne({ institute: req.user.institute, _id: req.user.id })
            .select("sem")
            .lean()

        const enrolled = await Enrollment.find({
            student: req.user.id,
            institute: req.user.institute
        }).select("course");

        const enrolledIds = enrolled.map(e => e.course);

        const courses = await Course.find({
            institute: req.user.institute,
            semester: student.sem,
            _id: { $nin: enrolledIds }
        })
            .populate("department", "name code");

        res.status(200).json({ success: true, data: courses })
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

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

        const enrollments = await Enrollment.find({
            student: studentId,
            institute: instituteId
        })
            .populate({
                path: "section",
                select: "sectionName academicYear teacher course",
                populate: [
                    {
                        path: "teacher",
                        select: "name"
                    },
                    {
                        path: "course",
                        select: "name code department",
                        populate: {
                            path: "department",
                            select: "name code"
                        }
                    }
                ]
            })
            .lean();

        const formatted = enrollments.map(enroll => ({
            enrollmentId: enroll._id,
            course: {
                id: enroll.section.course._id,
                name: enroll.section.course.name,
                code: enroll.section.course.code,
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
                name: enroll.section.teacher.name
            }
        }));

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
                maxMarks: assessment.maxMarks,
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
                if (record.status === "Present") presentCount++;
                if (record.status === "Absent") absentCount++;

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
}