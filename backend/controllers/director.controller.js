import Institute from "../models/Institute.js";
import Director from "../models/Director.js"
import Department from "../models/Department.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";

//----------------------------------------
//           CRUD Department
//----------------------------------------
// CREATE Department
const createDepartment = async (req, res) => {
    try {
        const instituteId = req.user.institute;

        let hodId = null;
        if (req.body.hod) {
            const teacher = await Teacher.findById(req.body.hod);
            if (!teacher) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid teacher ID for HOD"
                });
            }
            hodId = teacher._id;
        }

        const department = await Department.create({
            name: req.body.name,
            code: req.body.code,
            institute: instituteId,
            hod: hodId
        });

        res.status(201).json({
            success: true,
            message: "Department Created Successfully",
            data: department
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Department already exists in the institute"
            });
        }
        return res.status(400).json({ success: false, message: error.message });
    }
};

// READ Departments
const readDepartment = async (req, res) => {
    try {
        const instituteId = req.user.institute;

        const departments = await Department.find({ institute: instituteId })
            .populate("hod", "name")
            .populate("institute", "name code");

        res.status(200).json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// UPDATE Department
const updateDepartment = async (req, res) => {
    try {
        const instituteId = req.user.institute;

        if (req.body.hod) {
            const teacher = await Teacher.findById(req.body.hod);
            if (!teacher) {
                return res.status(400).json({ success: false, message: "Invalid teacher ID for HOD" });
            }
        }

        const department = await Department.findOneAndUpdate(
            { _id: req.params.departmentid, institute: instituteId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.status(200).json({ success: true, message: "Department updated successfully", data: department });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE Department
const deleteDepartment = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const departmentId = req.params.departmentid;

        const department = await Department.findOne({
            _id: departmentId,
            institute: instituteId
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // Check if students exist
        const studentExists = await Student.exists({
            institute: instituteId,
            department: departmentId
        });

        if (studentExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete department with existing students"
            });
        }

        // Check if teachers exist
        const teacherExists = await Teacher.exists({
            institute: instituteId,
            department: departmentId
        });

        if (teacherExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete department with existing teachers"
            });
        }

        await Department.findByIdAndDelete(departmentId);

        res.status(200).json({
            success: true,
            message: "Department deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           CRUD Teachers
//----------------------------------------

// CREATE Teacher
const createTeacher = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const { firstName, lastName, phone, department } = req.body;

        if (!firstName || !lastName || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const dept = await Department.findOne({
            _id: department,
            institute: instituteId
        });

        if (!dept) {
            return res.status(400).json({
                success: false,
                message: "Invalid department"
            });
        }

        const institute = await Institute.findById(instituteId);
        const name = `${firstName.trim()} ${lastName.trim()}`;

        const baseEmail = `${name.toLowerCase().replace(/\s+/g, ".")}_${dept.code.toLowerCase()}`;
        const domain = institute.code.toLowerCase();

        let email = `${baseEmail}@${domain}.edu`;
        let counter = 1;

        while (await Teacher.findOne({ email })) {
            email = `${baseEmail}_${counter}@${domain}.edu`;
            counter++;
        }

        const password = "Pass@123";

        const teacher = await Teacher.create({
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            department,
            email,
            password,
            role: "teacher",
            institute: instituteId
        });

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            credentials: { email, password }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Read Teacher
const readTeacher = async (req, res) => {
    try {
        const instituteId = req.user.institute;

        const filter = { institute: instituteId, role: "teacher" };

        const teachers = await Teacher.find(filter)
            .populate("institute", "name code");

        res.status(200).json({ success: true, data: teachers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//Update Teacher
const updateTeacher = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const teacherId = req.params.teacherid;

        const teacher = await Teacher.findOne({
            _id: teacherId,
            institute: instituteId,
            role: "teacher"
        })

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        const { firstName, lastName, phone, department } = req.body;

        let dept = teacher.department;

        if (department) {
            dept = await Department.findOne({
                _id: department,
                institute: instituteId
            });

            if (!dept) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department"
                });
            }

            teacher.department = dept._id;
        }

        if (firstName) {
            teacher.firstName = firstName;
        }

        if (lastName) {
            teacher.lastName = lastName;
        }

        if (phone) {
            teacher.phone = phone;
        }

        if (firstName || lastName || department) {
            const name = `${teacher.firstName} ${teacher.lastName}`;

            const institute = await Institute.findById(instituteId);

            const baseEmail = `${name.toLowerCase().replace(/\s+/g, ".")}_${dept.code.toLowerCase()}`;
            const domain = institute.code.toLowerCase();

            let email = `${baseEmail}@${domain}.edu`;
            let counter = 1;

            while (await Teacher.findOne({ email, _id: { $ne: teacher._id } })) {
                email = `${baseEmail}_${counter}@${domain}.edu`;
                counter++;
            }

            teacher.email = email;
        }

        await teacher.save();

        res.status(200).json({
            message: "Teacher updated successfully",
            teacher: teacher
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//Delete Teacher
const deleteTeacher = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const teacherId = req.params.teacherid;

        const sectionExists = await Section.exists({ institute: instituteId, teacher: teacherId });

        if (sectionExists) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete teacher assigned to sections"
            });
        }

        const teacher = await Teacher.findOneAndDelete({
            _id: teacherId,
            institute: instituteId,
            role: "teacher"
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Teacher deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

//Promote to HOD
const promote = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const teacherId = req.params.teacherid;

        const teacher = await Teacher.findOne({
            _id: teacherId,
            institute: instituteId,
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        if (teacher.role === "hod") {
            return res.status(400).json({
                success: false,
                message: "Teacher is already HOD"
            });
        }

        const department = await Department.findOne({
            _id: teacher.department,
            institute: instituteId
        });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // If department already has HOD
        if (department.hod) {
            const oldHod = await Teacher.findOne({
                _id: department.hod,
                institute: instituteId
            });

            if (oldHod) {
                oldHod.role = "teacher";
                await oldHod.save();
            }
        }

        teacher.role = "hod";
        department.hod = teacher._id;

        await teacher.save();
        await department.save();

        res.status(200).json({
            success: true,
            message: "Teacher promoted to HOD successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

//----------------------------------------
//           CRUD Student
//----------------------------------------

// CREATE Student
const createStudent = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const { firstName, lastName, phone, department } = req.body;

        if (!firstName || !lastName || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate Department
        const dept = await Department.findOne({
            _id: department,
            institute: instituteId
        });

        if (!dept) {
            return res.status(400).json({
                success: false,
                message: "Invalid department"
            });
        }

        const institute = await Institute.findById(instituteId);

        // ATOMIC COUNTER INCREMENT
        const updatedDept = await Department.findByIdAndUpdate(
            department,
            { $inc: { studentCounter: 1 } },
            { new: true }
        );

        const counter = updatedDept.studentCounter;

        // Generate Roll Number
        const paddedNumber = counter.toString().padStart(5, "0");
        const rollNo = `${updatedDept.code.toUpperCase()}${paddedNumber}`;

        const domain = institute.code.toLowerCase();
        const email = `${rollNo.toLowerCase()}@${domain}.edu`;
        const password = "Pass@123";

        // Create Student
        await Student.create({
            firstName,
            lastName,
            phone,
            email,
            password,
            department,
            rollNo,
            institute: instituteId
        });

        res.status(201).json({
            success: true,
            message: "Student Created Successfully",
            credentials: { email, password }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//READ Student
const readStudent = async (req, res) => {
    try {
        const instituteId = req.user.institute;

        const filter = { institute: instituteId, role: "student" };

        const students = await Student.find(filter)
            .populate("institute", "name code");

        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//UPDATE Student
const updateStudent = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const studentId = req.params.studentid;
        const { firstName, lastName, phone, department, sem } = req.body;

        const student = await Student.findOne({
            _id: studentId,
            institute: instituteId,
            role: "student"
        });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Update name
        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;
        if (phone) student.phone = phone;

        // Update semester
        if (sem) student.sem = sem;

        // If department changes
        if (department && department.toString() !== student.department.toString()) {

            const newDept = await Department.findOne({
                _id: department,
                institute: instituteId
            });

            if (!newDept) {
                return res.status(400).json({ message: "Invalid department" });
            }

            //Increment counter ONLY (no decrement)
            const updatedDept = await Department.findByIdAndUpdate(
                department,
                { $inc: { studentCounter: 1 } },
                { new: true }
            );

            const padded = updatedDept.studentCounter
                .toString()
                .padStart(5, "0");

            const newRollNo = `${updatedDept.code.toUpperCase()}${padded}`;

            student.rollNo = newRollNo;
            student.department = department;

            // Update email
            const institute = await Institute.findById(instituteId);
            const domain = institute.code.toLowerCase();

            student.email = `${newRollNo.toLowerCase()}@${domain}.edu`;
        }

        await student.save()

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//DELETE Student
const deleteStudent = async (req, res) => {
    try {
        const instituteId = req.user.institute;
        const studentId = req.params.studentid;

        // Find student
        const student = await Student.findOneAndDelete({ _id: studentId, institute: instituteId });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
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
        const director = await Director.findById(req.user.id).populate("institute")

        if (!director) {
            return res.status(404).json({ success: false, message: "Director not found" });
        }

        res.status(200).json({ success: true, data: director });
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
        const directorId = req.user.id; // from auth middleware
        const { firstName, lastName, phone, gender, dateOfBirth, joiningDate } = req.body;

        const director = await Director.findById(directorId);

        if (!director) {
            return res.status(404).json({ success: false, message: "Director not found" });
        }

        // Update director fields if provided
        if (firstName) director.firstName = firstName;
        if (lastName) director.lastName = lastName;
        if (phone) director.phone = phone;
        if (gender) director.gender = gender;
        if (dateOfBirth) director.dateOfBirth = dateOfBirth;
        if (joiningDate) director.joiningDate = joiningDate;

        await director.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            body: director
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE INSTITUTE DETAILS (DIRECTOR ONLY)
const updateInstitute = async (req, res) => {
    try {
        const directorId = req.user.id;
        const { name, code, address, establishedYear } = req.body;

        const director = await Director.findById(directorId);

        if (!director) {
            return res.status(404).json({ success: false, message: "Director not found" });
        }

        const institute = await Institute.findById(director.institute);
        if (!institute) {
            return res.status(404).json({ success: false, message: "Institute not found" });
        }

        if (name) institute.name = name;
        if (code) institute.code = code;
        if (address) institute.address = address;
        if (establishedYear) institute.establishedYear = establishedYear;

        await institute.save();

        res.status(200).json({
            success: true,
            message: "Institute details updated successfully",
            body: institute
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const directorId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new password are required" });
        }

        const director = await Director.findById(directorId);

        if (!director) {
            return res.status(404).json({ success: false, message: "Director not found" });
        }

        const isMatch = await director.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        if (currentPassword == newPassword) {
            return res.status(400).json({ success: false, message: "Current Password and New Password cannot be same" })
        }

        director.password = newPassword;
        director.mustChangePassword = false;
        await director.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    //ADMIN 

    //CRUD Department
    createDepartment,
    readDepartment,
    updateDepartment,
    deleteDepartment,

    //CRUD Teacher
    createTeacher,
    readTeacher,
    updateTeacher,
    deleteTeacher,

    //HOD Promotion
    promote,

    //CRUD Student
    createStudent,
    readStudent,
    updateStudent,
    deleteStudent,


    //Profile
    readProfile,
    updateProfile,
    updateInstitute,
    changePassword
}