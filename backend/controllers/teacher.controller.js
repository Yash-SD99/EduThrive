import Teacher from "../models/Teacher.js"
import Section from "../models/Section.js"
import Assessment from "../models/Assessment.js"
import Attendance from "../models/Attendance.js"
import Marks from "../models/Marks.js"
import Enrollment from "../models/Enrollment.js"
import mongoose from "mongoose"

//----------------------------------------
//           Section
//----------------------------------------
const getSections = async (req, res) => {
    try {
        const filter = {
            teacher: req.user.id,
            institute: req.user.institute
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {
            const sections = await Section.find(filter)
                .populate("course", "name code")
                .sort({ createdAt: -1 })
                .lean();

            return res.status(200).json({
                success: true,
                data: sections
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Section.countDocuments(filter);

        const sections = await Section.find(filter)
            .populate("course", "name code")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: sections,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
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

        const filter = {
            section: sectionId,
            institute: req.user.institute
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {
            const assessments = await Assessment.find(filter)
                .sort({ date: 1 })
                .lean();

            return res.status(200).json({
                success: true,
                count: assessments.length,
                data: assessments
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Assessment.countDocuments(filter);

        const assessments = await Assessment.find(filter)
            .sort({ date: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: assessments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
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
        })
            .populate("student", "rollNo")
            .select("student");

        const studentRollMap = new Map();

        for (const e of enrollments) {
            studentRollMap.set(
                e.student._id.toString(),
                e.student.rollNo
            );
        }

        const bulkOps = [];

        for (const entry of marks) {

            const rollNo = studentRollMap.get(entry.studentId);

            // check enrollment
            if (!rollNo) {
                return res.status(400).json({
                    success: false,
                    message: `Student ${entry.studentId} not enrolled in this section`
                });
            }

            // validate marks
            if (
                entry.marksObtained < 0 ||
                entry.marksObtained > assessment.totalMarks
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid marks for student ${rollNo}`
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

//CREATE Attendance 
// POST /sections/:sectionId/attendance
const createAttendance = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { date } = req.body;

        if (!sectionId || !date) {
            return res.status(400).json({
                success: false,
                message: "Section and date required"
            });
        }

        // Validate Section
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

        // Check duplicate (important because of unique index)
        const exists = await Attendance.findOne({
            institute: req.user.institute,
            section: sectionId,
            date: normalizedDate
        });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Attendance already exists for this date"
            });
        }

        // Get students
        const enrollments = await Enrollment.find({
            institute: req.user.institute,
            section: sectionId
        }).select("student");

        const records = enrollments.map(e => ({
            student: e.student,
            status: "absent"
        }));

        const attendance = await Attendance.create({
            institute: req.user.institute,
            section: sectionId,
            date: normalizedDate,
            records,
            markedBy: req.user.id
        });

        res.status(201).json({
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
// GET /sections/:sectionId/attendance
const getAttendance = async (req, res) => {
    try {
        const { sectionId } = req.params;

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

        const filter = {
            institute: req.user.institute,
            section: sectionId
        };

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Attendance.countDocuments(filter);

        const attendance = await Attendance.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: attendance,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET /sections/:sectionId/attendance/:attendanceId
const getAttendanceById = async (req, res) => {
    try {
        const { sectionId, attendanceId } = req.params;

        // check section ownership first
        const section = await Section.findOne({
            _id: sectionId,
            teacher: req.user.id
        });

        if (!section) {
            return res.status(403).json({
                success: false,
                message: "Not authorised"
            });
        }

        const attendanceArr = await Attendance.aggregate([

            // find attendance
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(attendanceId),
                    section: new mongoose.Types.ObjectId(sectionId),
                    institute: new mongoose.Types.ObjectId(req.user.institute)
                }
            },

            // break records array
            {
                $unwind: {
                    path: "$records",
                    preserveNullAndEmptyArrays: true
                }
            },

            // join student
            {
                $lookup: {
                    from: "students",
                    localField: "records.student",
                    foreignField: "_id",
                    as: "student"
                }
            },

            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true
                }
            },

            // sort by rollNo
            {
                $sort: { "student.rollNo": 1 }
            },

            // reshape record
            {
                $project: {
                    _id: 1,
                    date: 1,
                    section: 1,
                    institute: 1,
                    record: {
                        student: {
                            _id: "$student._id",
                            firstName: "$student.firstName",
                            lastName: "$student.lastName",
                            rollNo: "$student.rollNo"
                        },
                        status: "$records.status"
                    }
                }
            },

            // group back to array
            {
                $group: {
                    _id: "$_id",
                    date: { $first: "$date" },
                    section: { $first: "$section" },
                    institute: { $first: "$institute" },
                    records: {
                        $push: {
                            $cond: [
                                { $ifNull: ["$record.student._id", false] },
                                "$record",
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            }

        ]);

        if (!attendanceArr.length) {
            return res.status(404).json({
                success: false,
                message: "Attendance not found"
            });
        }

        res.status(200).json({
            success: true,
            data: attendanceArr[0]
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

//GET Studetns by section
const getStudentsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const section = await Section.findOne({
            _id: sectionId,
            institute: req.user.institute,
            teacher: req.user.id
        }).lean();

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found or not authorised"
            });
        }

        const filter = {
            institute: req.user.institute,
            section: sectionId
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {

            const students = await Enrollment.aggregate([
                {
                    $match: {
                        institute: new mongoose.Types.ObjectId(req.user.institute),
                        section: new mongoose.Types.ObjectId(sectionId)
                    }
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "student",
                        foreignField: "_id",
                        as: "student"
                    }
                },
                { $unwind: "$student" },

                { $sort: { "student.rollNo": 1 } },

                {
                    $project: {
                        _id: "$student._id",
                        firstName: "$student.firstName",
                        lastName: "$student.lastName",
                        rollNo: "$student.rollNo"
                    }
                }
            ]);

            return res.status(200).json({
                success: true,
                count: students.length,
                data: students
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Enrollment.countDocuments(filter);

        const students = await Enrollment.aggregate([
            {
                $match: {
                    institute: new mongoose.Types.ObjectId(req.user.institute),
                    section: new mongoose.Types.ObjectId(sectionId)
                }
            },

            {
                $lookup: {
                    from: "students",
                    localField: "student",
                    foreignField: "_id",
                    as: "student"
                }
            },

            { $unwind: "$student" },

            { $sort: { "student.rollNo": 1 } },

            { $skip: skip },
            { $limit: limit },

            {
                $project: {
                    _id: "$student._id",
                    firstName: "$student.firstName",
                    lastName: "$student.lastName",
                    rollNo: "$student.rollNo"
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
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

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment Not Found"
            });
        }

        if (enrollment.section.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        const filter = {
            institute: req.user.institute,
            student: enrollment.student,
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {
            const marks = await Marks.find(filter)
                .populate("assessment", "title totalMarks type")
                .sort({ createdAt: -1 })
                .lean();

            return res.status(200).json({
                success: true,
                count: marks.length,
                data: marks
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Marks.countDocuments(filter);

        const marks = await Marks.find(filter)
            .populate("assessment", "title totalMarks type")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: marks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
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
        }).lean();

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        const filter = {
            institute: req.user.institute,
            section: enrollment.section,
            "records.student": enrollment.student
        };

        const isPaginated = req.query.page || req.query.limit;

        // =============================
        // NON-PAGINATED
        // =============================
        if (!isPaginated) {
            const attendance = await Attendance.find(filter)
                .sort({ date: -1 })
                .lean();

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        // =============================
        // PAGINATED
        // =============================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Attendance.countDocuments(filter);

        const attendance = await Attendance.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: attendance,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
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

        await teacher.save();

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

        const isMatch = await teacher.comparePassword(currentPassword);
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
    createAttendance,
    getAttendance,
    getAttendanceById,
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