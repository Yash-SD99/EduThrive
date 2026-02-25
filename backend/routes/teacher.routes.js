import express from "express";
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js";
import Teacher from "../controllers/teacher.controller.js";

const router = express.Router();

//applied to all teacher routes
router.use(protect)
router.use(allowRoles("hod", "teacher"))

router.get("/dashboard", (req, res) => {
    res.json({ message: "Teacher dashboard OK" });
})

//Sections
router.get("/sections", Teacher.getSections)
router.get("/sections/:sectionId", Teacher.readSection)

//Assessments
router.post("/sections/:sectionId/assessments", Teacher.createAssessment)
router.get("/sections/:sectionId/assessments", Teacher.readAssessmentsBySection)
router.get("/sections/:sectionId/assessments/:assessmentId", Teacher.readAssessment)
router.put("/sections/:sectionId/assessments/:assessmentId", Teacher.updateAssessment)
router.delete("/sections/:sectionId/assessments/:assessmentId", Teacher.deleteAssessment)

//Marks
router.get("/sections/:sectionId/assessments/:assessmentId/marks", Teacher.getMarksByAssessment)
router.put("/sections/:sectionId/assessments/:assessmentId/marks", Teacher.upsertMarks)
router.delete("/sections/:sectionId/assessments/:assessmentId/marks/:markId", Teacher.deleteMark)

//Attendance
router.put("/sections/:sectionId/attendance", Teacher.upsertAttendance)
router.get("/sections/:sectionId/attendance", Teacher.getAttendance)
router.delete("/sections/:sectionId/attendance/:attendanceId", Teacher.deleteAttendance)

//Student
router.get("/sections/:sectionId/students", Teacher.getStudentsBySection)
router.get("/sections/:sectionId/students/:enrollmentId/marks", Teacher.getMarksByStudent)
router.get("/sections/:sectionId/students/:enrollmentId/attendance", Teacher.getAttendanceByStudent)

//Profile
router.get("/profile", Teacher.readProfile)
router.put("/profile", Teacher.updateProfile)
router.put("/profile/change-password", Teacher.changePassword)

export default router