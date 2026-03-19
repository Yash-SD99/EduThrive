import express from "express"
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js"
import Director from "../controllers/director.controller.js"

const router = express.Router()

//applicable to all director routes
router.use(protect)
router.use(allowRoles("director"))

router.get("/dashboard", (req, res) => {
    res.json({ message: "Director dashboard OK" })
})

//CRUD Department
router.post("/departments", Director.createDepartment)
router.get("/departments", Director.getDepartments)
router.get("/departments/:departmentid", Director.getTeachersByDepartment)
router.put("/departments/:departmentid", Director.updateDepartment)
router.delete("/departments/:departmentid", Director.deleteDepartment)

//CRUD Teacher
router.post("/teachers", Director.createTeacher)
router.get("/teachers", Director.getTeachers)
router.put("/teachers/:teacherid", Director.updateTeacher)
router.delete("/teachers/:teacherid", Director.deleteTeacher)

//HOD Promotion
router.post("/teachers/:teacherid/promote", Director.promote)

//CRUD Student
router.post("/students", Director.createStudent)
router.get("/students", Director.getStudents)
router.put("/students/:studentid", Director.updateStudent)
router.delete("/students/:studentid", Director.deleteStudent)

//Profile
router.get("/profile", Director.readProfile)
router.put("/profile", Director.updateProfile)
router.put("/profile/institute", Director.updateInstitute)
router.put("/profile/change-password", Director.changePassword)

export default router