import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import Student from "../controllers/student.controller.js";

const router = express.Router();

//applied to all student routes
router.use(protect);
router.use(allowRoles("student"));

router.get("/dashboard", (req, res) => {
    res.json({ message: "Student dashboard OK" });
});

//Courses
router.get("/courses/available", Student.readCourses)
router.post("/courses/available/:courseId/enroll", Student.enroll)

//My Courses
router.get("/courses", Student.MyCourses)
router.get("/courses/:courseId/marks", Student.getMarksByCourse)
router.get("/courses/:courseId/attendance", Student.getAttendanceByCourse)

//Profile
router.get("/profile", Student.readProfile)
router.put("/profile", Student.updateProfile)
router.put("/profile/change-password", Student.changePassword)

export default router;