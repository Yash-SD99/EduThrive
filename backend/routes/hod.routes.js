import express from "express"
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js"
import HOD from "../controllers/hod.controller.js"

const router = express.Router()

//applicable to all hod routes
router.use(protect)
router.use(allowRoles("hod"))

router.get("/dashboard", (req, res) => {
    res.json({message: "HOD dashboard OK"})
})

//CRUD Course
router.post("/courses", HOD.createCourse)
router.get("/courses", HOD.getCourses)
router.put("/courses/:id", HOD.updateCourse)
router.delete("/courses/:id", HOD.deleteCourse)

//CRUD Section
router.post("/sections", HOD.createSection)
router.get("/sections", HOD.getSections)
router.put("/sections/:id", HOD.updateSection)
router.delete("/sections/:id", HOD.deleteSection)

//GET Teachers
router.get("/teachers", HOD.getTeachers)

//Profile
router.get("/profile", HOD.readProfile)
router.put("/profile", HOD.updateProfile)
router.put("/profile/change-password", HOD.changePassword)


export default router