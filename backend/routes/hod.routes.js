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
router.post("/course", HOD.createCourse)
router.get("/course", HOD.readCourse)
router.put("/course", HOD.updateCourse)
router.delete("/course", HOD.deleteCourse)

//CRUD Section
router.post("/section", HOD.createSection)
router.get("/section", HOD.readSections)
router.put("/section", HOD.updateSection)
router.delete("/section", HOD.deleteSection)

//Profile
router.get("/profile", HOD.readProfile)
router.put("/profile", HOD.updateProfile)
router.put("/profile/change-password", HOD.changePassword)


export default router