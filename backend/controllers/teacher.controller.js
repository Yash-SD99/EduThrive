import Teacher from "../models/Teacher.js"
import Section from "../models/Section.js"
import Assessment from "../models/Assessment.js"
import Attendance from "../models/Attendance.js"
import Marks from "../models/Marks.js"
import Enrollment from "../models/Enrollment.js"


//----------------------------------------
//           Section
//----------------------------------------
// GET Sections
const getSections = async (req, res) => {
    try {
        const sections = await Section.find({
            institute: req.user.institute,
            teacher: req.user.id
        })
        .populate("course", "name")
        .populate("department", "name");

        res.status(200).json({
            success: true,
            data: sections
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ Section
const readSection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        if (!sectionId) {
            return res.status(400).json({
                success: false,
                message: "Section id is required"
            });
        }

        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute
        })
        .populate("course", "name code")
        .populate("department", "name")
        .populate("teacher", "name email");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        // Authorization check
        if (section.teacher._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        res.status(200).json({
            success: true,
            data: section
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           CRUD Assessment
//----------------------------------------

//CREATE Assessment
const createAssessment = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title, type, totalMarks, date } = req.body;

        if (!sectionId || !title || !type || !totalMarks || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute
        }).select("teacher");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        if (section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        await Assessment.create({
            institute: req.user.institute,
            section: sectionId,
            title,
            type,
            totalMarks,
            date: normalizedDate
        });

        res.status(201).json({
            success: true,
            message: "Assessment created successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ All assessments of a section
const readAssessmentsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        if (!sectionId) {
            return res.status(400).json({
                success: false,
                message: "Section id is required"
            });
        }

        //Check section exists & belongs to institute
        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute
        }).select("teacher");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        //Authorization check
        if (section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        //Fetch assessments
        const assessments = await Assessment.find({
            section: sectionId,
            institute: req.user.institute
        }).sort({ date: -1 }); // latest first

        res.status(200).json({
            success: true,
            count: assessments.length,
            data: assessments
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ Assessment
const readAssessment = async (req, res) => {
    try {
        const { sectionId, assessmentId } = req.params;

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            section: sectionId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        if (assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        res.status(200).json({
            success: true,
            data: assessment
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE Assessment
const updateAssessment = async (req, res) => {
    try {
        const { sectionId, assessmentId } = req.params;
        const { title, type, totalMarks, date } = req.body;

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            section: sectionId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        if (assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        if (totalMarks !== undefined && totalMarks <= 0) {
            return res.status(400).json({
                success: false,
                message: "Total marks must be greater than 0"
            });
        }

        if (title) assessment.title = title;
        if (type) assessment.type = type;
        if (totalMarks !== undefined) assessment.totalMarks = totalMarks;

        if (date) {
            const normalizedDate = new Date(date);
            normalizedDate.setHours(0, 0, 0, 0);
            assessment.date = normalizedDate;
        }

        await assessment.save();

        res.status(200).json({
            success: true,
            message: "Assessment updated successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE Assessment
const deleteAssessment = async (req, res) => {
    try {
        const { sectionId, assessmentId } = req.params;

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            section: sectionId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        if (assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        await assessment.deleteOne();

        res.status(200).json({
            success: true,
            message: "Assessment deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           Marks
//----------------------------------------

//GET Marks For Assessment
const getMarksByAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        if (assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        const marks = await Marks.find({
            institute: req.user.institute,
            assessment: assessmentId
        }).populate("student", "name rollNumber");

        res.status(200).json({
            success: true,
            data: marks
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// BULK UPSERT MARKS  Upsert => if exists -> update, else -> insert
const upsertMarks = async (req, res) => {
    try {
        const { assessmentId } = req.params
        const { marks } = req.body;

        if (!assessmentId || !Array.isArray(marks)) {
            return res.status(400).json({
                success: false,
                message: "Assessment ID and marks array required"
            });
        }

        //Validate Assessment
        const assessment = await Assessment.findOne({
            _id: assessmentId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        //Validate Teacher Ownership
        if (assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        //Get Students Enrolled In That Section
        const enrollments = await Enrollment.find({
            institute: req.user.institute,
            section: assessment.section._id
        }).select("student");

        const validStudentSet = new Set(
            enrollments.map(e => e.student.toString())
        );

        const bulkOps = [];

        for (const entry of marks) {

            if (!validStudentSet.has(entry.studentId)) {
                return res.status(400).json({
                    success: false,
                    message: `Student ${entry.studentId} not enrolled in this section`
                });
            }

            if (
                entry.marksObtained < 0 ||
                entry.marksObtained > assessment.totalMarks
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid marks for student ${entry.studentId}`
                });
            }

            bulkOps.push({
                updateOne: {
                    filter: {
                        institute: req.user.institute,
                        student: entry.studentId,
                        assessment: assessmentId
                    },
                    update: {
                        $set: {
                            marksObtained: entry.marksObtained
                        }
                    },
                    upsert: true
                }
            });
        }

        if (bulkOps.length > 0) {
            await Marks.bulkWrite(bulkOps);
        }

        res.status(200).json({
            success: true,
            message: "Marks saved successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Delete Mark
const deleteMark = async (req, res) => {
    try {
        const { markId } = req.params;

        const mark = await Marks.findOne({
            _id: markId,
            institute: req.user.institute
        }).populate({
            path: "assessment",
            populate: {
                path: "section",
                select: "teacher"
            }
        });

        if (!mark) {
            return res.status(404).json({
                success: false,
                message: "Mark not found"
            });
        }

        if (mark.assessment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        await mark.deleteOne();

        res.status(200).json({
            success: true,
            message: "Mark deleted"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


//----------------------------------------
//           Attendance
//----------------------------------------

// BULK UPSERT Attendance  Upsert => if exists -> update, else -> insert
const upsertAttendance = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { date, records } = req.body;

        if (!sectionId || !date || !Array.isArray(records)) {
            return res.status(400).json({
                success: false,
                message: "Section, date and records required"
            });
        }

        //Validate Section & Ownership
        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute
        }).select("teacher");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        if (section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        //Get All Enrolled Students
        const enrollments = await Enrollment.find({
            institute: req.user.institute,
            section: sectionId
        }).select("student");

        const allStudentIds = enrollments.map(e =>
            e.student.toString()
        );

        const validStudentSet = new Set(allStudentIds);

        // Validate incoming students
        for (const entry of records) {
            if (!validStudentSet.has(entry.studentId)) {
                return res.status(400).json({
                    success: false,
                    message: `Student ${entry.studentId} not enrolled`
                });
            }
        }

        //Check if attendance already exists
        let attendance = await Attendance.findOne({
            institute: req.user.institute,
            section: sectionId,
            date: normalizedDate
        });

        // ---------------------------
        // SCENARIO A: FIRST TIME
        // ---------------------------
        if (!attendance) {

            // Default all to absent
            const defaultRecords = allStudentIds.map(id => ({
                student: id,
                status: "absent"
            }));

            // Override provided records
            for (const entry of records) {
                const index = defaultRecords.findIndex(
                    r => r.student.toString() === entry.studentId
                );

                if (index !== -1) {
                    defaultRecords[index].status = entry.status;
                }
            }

            await Attendance.create({
                institute: req.user.institute,
                section: sectionId,
                date: normalizedDate,
                records: defaultRecords,
                markedBy: req.user.id
            });

        } else {

            // ---------------------------
            // SCENARIO B: UPDATE ONLY SENT
            // ---------------------------

            for (const entry of records) {
                const record = attendance.records.find(
                    r => r.student.toString() === entry.studentId
                );

                if (record) {
                    record.status = entry.status;
                }
            }

            attendance.markedBy = req.user.id;
            await attendance.save();
        }

        res.status(200).json({
            success: true,
            message: "Attendance saved successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//GET Attendance
const getAttendance = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { date } = req.query;

        //Validate Section + Institute
        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute
        }).select("teacher");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        //Authorization Check (Teacher owns section)
        if (section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        //If date is provided → return single day attendance
        if (date) {
            const normalizedDate = new Date(date);

            if (isNaN(normalizedDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format"
                });
            }

            normalizedDate.setHours(0, 0, 0, 0);

            const attendance = await Attendance.findOne({
                institute: req.user.institute,
                section: sectionId,
                date: normalizedDate
            }).populate("records.student", "name rollNumber");

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance not found for this date"
                });
            }

            return res.status(200).json({
                success: true,
                data: attendance
            });
        }

        //If no date -> return all attendance of section
        const attendance = await Attendance.find({
            institute: req.user.institute,
            section: sectionId
        })
        .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//DELETE Attendance
const deleteAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;

        const attendance = await Attendance.findOne({
            _id: attendanceId,
            institute: req.user.institute
        }).populate("section", "teacher");

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance not found"
            });
        }

        if (attendance.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        await attendance.deleteOne();

        res.status(200).json({
            success: true,
            message: "Attendance deleted"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           Student
//----------------------------------------

const getStudentsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        //Validate Section + Ownership
        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute,
            teacher: req.user.id
        });

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found or not authorised"
            });
        }

        //Get Enrollments for this Section
        const enrollments = await Enrollment.find({
            institute: req.user.institute,
            section: sectionId
        })
        .populate("student", "name rollNumber email")
        .select("student");

        //Extract Students
        const students = enrollments.map(e => e.student);

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Get Marks For Student
const getMarksByStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const enrollment = await Enrollment.findOne({
            institute: req.user.institute,
            _id: enrollmentId,
        })
        .populate("section", "teacher")
        .lean();

        if(!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment Not Found"
            });
        }

        if(enrollment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this section"
            });
        }

        const marks = await Marks.find({
            institute: req.user.institute,
            student:enrollment.student,
        }).populate("assessment", "title totalMarks type");

        res.status(200).json({
            success: true,
            data: marks
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//GET Attendance for Student
const getAttendanceByStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            institute: req.user.institute
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        const attendance = await Attendance.find({
            institute: req.user.institute,
            section: enrollment.section,
            "records.student": enrollment.student
        });

        res.status(200).json({
            success: true,
            data: attendance
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
        const teacher = await Teacher.findById(req.user.id)

        if (!teacher) {
            return res.status(404).json({ success: false, message: "teacher not found" });
        }

        res.status(200).json({ success: true, data: teacher });
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
        const teacherId = req.user.id; // from auth middleware
        const { firstName, lastName, phone, gender, dateOfBirth } = req.body;

        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ success: false, message: "teacher not found" });
        }

        // Update teacher fields if provided
        if (firstName) teacher.firstName = firstName;
        if (lastName) teacher.lastName = lastName;
        if (phone) teacher.phone = phone;
        if (gender) teacher.gender = gender;
        if (dateOfBirth) teacher.dateOfBirth = dateOfBirth;

        await Teacher.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            body: teacher
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new password are required" });
        }

        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ success: false, message: "teacher not found" });
        }

        const isMatch = await Teacher.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        if (currentPassword == newPassword) {
            return res.status(400).json({ success: false, message: "Current Password and New Password cannot be same" })
        }

        teacher.password = newPassword;
        teacher.mustChangePassword = false;
        await teacher.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    //Section
    getSections,
    readSection,

    //Assessments
    createAssessment,
    readAssessmentsBySection,
    readAssessment,
    updateAssessment,
    deleteAssessment,

    //Marks
    getMarksByAssessment,
    upsertMarks,
    deleteMark,

    //Attendance
    getAttendance,
    upsertAttendance,
    deleteAttendance,

    //Students
    getStudentsBySection,
    getMarksByStudent,
    getAttendanceByStudent,

    //Profile
    readProfile,
    updateProfile,
    changePassword,
}