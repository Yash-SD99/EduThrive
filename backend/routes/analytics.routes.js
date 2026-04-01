import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  getDirectorAnalytics,
  getHodAnalytics,
  getTeacherAnalytics,
  getStudentAnalytics,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.use(protect);

// Each route additionally guards via allowRoles
router.get("/director", allowRoles("director"), getDirectorAnalytics);
router.get("/hod", allowRoles("hod"), getHodAnalytics);
router.get("/teacher", allowRoles("hod", "teacher"), getTeacherAnalytics);
router.get("/student", allowRoles("student"), getStudentAnalytics);

export default router;