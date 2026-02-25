import Course from "../models/Course.js";
import Section from "../models/Section.js";
import Teacher from "../models/Teacher.js";

//----------------------------------------
//           CRUD Course
//----------------------------------------

//CREATE Course
const createCourse = async (req, res) => {
    try {
        const { name, sem, credits } = req.body;

        if (!name || !sem || !credits) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const hod = await Teacher.findById(req.user.id)
            .populate("institute", "code")
            .populate("department", "code")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        const cleanName = name.trim().replace(/\s+/g, "_").toUpperCase();

        let code = `${hod.institute.code}_${hod.department.code}_${cleanName}`;
        let counter = 1;

        while (await Course.findOne({ code, institute: hod.institute._id })) {
            code = `${hod.institute.code}_${hod.department.code}_${cleanName}_${counter}`;
            counter++;
        }

        const course = await Course.create({
            name: name.trim(),
            department: hod.department._id,
            institute: hod.institute._id,
            code,
            semester: sem,
            credits
        });

        res.status(201).json({
            success: true,
            message: "Course Created Successfully",
            course
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Course already exists"
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ Course
const readCourse = async (req, res) => {
    try {
        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean(); //Faster read because lean sends POJO instead of mongoose Document

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        const courses = await Course.find({ institute: hod.institute, department: hod.department })
            .select("name code semester credits createdAt")
            .sort({ semester: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//UPDATE Course
const updateCourse = async (req, res) => {
    try {

    }
    catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

//DELETE Course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        const course = await Course.findOne({
            _id: id,
            institute: hod.institute,
            department: hod.department
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or not authorized"
            });
        }

        //Section check
        const sectionExists = await Section.exists({ course: id });

        if (sectionExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete course. Sections already exist."
            });
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           CRUD Section
//----------------------------------------

//CREATE Section
const createSection = async (req, res) => {
    try {
        const { courseId, teacherId, sectionName, academicYear, capacity } = req.body;

        if (!courseId || !teacherId || !sectionName || !academicYear || !capacity) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (capacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be greater than 0"
            });
        }

        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        // Check Course belongs to HOD
        const course = await Course.findOne({
            _id: courseId,
            institute: hod.institute,
            department: hod.department
        }).lean();

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or not authorized"
            });
        }

        // Check Teacher belongs to same department
        const teacher = await Teacher.findOne({
            _id: teacherId,
            institute: hod.institute,
            department: hod.department
        }).lean();

        if (!teacher) {
            return res.status(400).json({
                success: false,
                message: "Teacher does not belong to this department"
            });
        }

        const section = await Section.create({
            course: courseId,
            teacher: teacherId,
            sectionName: sectionName.toUpperCase(),
            academicYear,
            capacity
        });

        res.status(201).json({
            success: true,
            message: "Section created successfully",
            section
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Section already exists for this course and academic year"
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//READ Section
const readSections = async (req, res) => {
    try {
        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        const courses = await Course.find({
            institute: hod.institute,
            department: hod.department
        }).select("_id").lean();

        const courseIds = courses.map(c => c._id);

        const sections = await Section.find({
            course: { $in: courseIds }
        })
        .populate("course", "name code")
        .populate("teacher", "name email")
        .lean();

        res.status(200).json({
            success: true,
            count: sections.length,
            data: sections
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//UPDATE Course
const updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherId, capacity } = req.body;

        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        // Find section + verify ownership
        const section = await Section.findById(id).populate("course");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        //Ownership check
        if (
            section.course.institute.toString() !== hod.institute.toString() ||
            section.course.department.toString() !== hod.department.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this section"
            });
        }

        // Update Teacher (only if provided)
        if (teacherId) {
            const teacher = await Teacher.findOne({
                _id: teacherId,
                institute: hod.institute,
                department: hod.department
            }).lean();

            if (!teacher) {
                return res.status(400).json({
                    success: false,
                    message: "Teacher does not belong to this department"
                });
            }

            section.teacher = teacherId;
        }

        // Update Capacity (only if provided)
        if (capacity !== undefined) {
            if (capacity < section.currentStrength) {
                return res.status(400).json({
                    success: false,
                    message: "Capacity cannot be less than current strength"
                });
            }

            section.capacity = capacity;
        }

        await section.save();

        res.status(200).json({
            success: true,
            message: "Section updated successfully",
            section
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//DELETE Section
const deleteSection = async (req, res) => {
    try {
        const { id } = req.params;

        const hod = await Teacher.findById(req.user.id)
            .select("institute department")
            .lean();

        if (!hod) {
            return res.status(404).json({
                success: false,
                message: "HOD not found"
            });
        }

        const section = await Section.findById(id).populate("course");

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        //Ownership check
        if (
            section.course.institute.toString() !== hod.institute.toString() ||
            section.course.department.toString() !== hod.department.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this section"
            });
        }

        //Prevent deletion if students enrolled
        const enrollmentExists = await Enrollment.exists({ section: id });

        if (enrollmentExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete section. Students are enrolled."
            });
        }

        await section.deleteOne();

        res.status(200).json({
            success: true,
            message: "Section deleted successfully"
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
const readProfile = async(req, res) => {
    try {
        const hod = await Teacher.findById(req.user.id)

        if (!hod) {
            return res.status(404).json({ success: false, message: "HOD not found" });
        }

        res.status(200).json({ success: true, data: hod });
    }
    catch(error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// UPDATE Profile
const updateProfile = async (req, res) => {
    try {
        const hodId = req.user.id; // from auth middleware
        const { firstName, lastName, phone, gender, dateOfBirth } = req.body;

        const hod = await Teacher.findById(hodId);

        if (!hod) {
            return res.status(404).json({ success: false, message: "hod not found" });
        }

        // Update hod fields if provided
        if (firstName) hod.firstName = firstName;
        if (lastName) hod.lastName = lastName;
        if (phone) hod.phone = phone;
        if (gender) hod.gender = gender;
        if (dateOfBirth) hod.dateOfBirth = dateOfBirth;

        await Teacher.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            body: hod
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const hodId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new password are required" });
        }

        const hod = await Teacher.findById(hodId);

        if (!hod) {
            return res.status(404).json({ success: false, message: "Hod not found" });
        }

        const isMatch = await Teacher.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        if(currentPassword == newPassword) {
            return res.status(400).json({success: false, message: "Current Password and New Password cannot be same"})
        }

        hod.password = newPassword;
        hod.mustChangePassword = false;
        await hod.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    //CRUD Course
    createCourse,
    readCourse,
    updateCourse,
    deleteCourse,

    //CRUD Section
    createSection,
    readSections,
    updateSection,
    deleteSection,

    //Profile
    readProfile,
    updateProfile,
    changePassword
}