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

//Admin Routes

//CRUD Department
router.post("/admin/department", Director.createDepartment)
router.get("/admin/department", Director.readDepartment)
router.put("/admin/department/:departmentid", Director.updateDepartment)
router.delete("/admin/department/:departmentid", Director.deleteDepartment)

//CRUD Teacher
router.post("/admin/teacher", Director.createTeacher)
router.get("/admin/teacher/", Director.readTeacher)
router.put("/admin/teacher/:teacherid", Director.updateTeacher)
router.delete("/admin/teacher/:teacherid", Director.deleteTeacher)

//CRUD Student
router.post("/admin/student", Director.createStudent)
router.get("/admin/student", Director.readStudent)
router.put("/admin/student/:studentid", Director.updateStudent)
router.delete("/admin/student/:studentid", Director.deleteStudent)

//Profile
router.get("/profile", Director.readProfile)
router.put("/profile", Director.updateProfile)
router.put("/profile/institute", Director.updateInstitute)
router.put("/profile/change-password", Director.changePassword)

export default router