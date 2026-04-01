// ─────────────────────────────────────────────────────────────
//  Mount each handler inside the EXISTING role router files.
//  The protect + allowRoles middleware is already applied by
//  those routers so you only need to add the one GET line each.
//
//  Alternatively, mount this standalone router in server.js:
//    import alertRoutes from "./routes/alerts.routes.js";
//    app.use("/api/alerts", alertRoutes);
//  and it will enforce its own auth + role guards.
// ─────────────────────────────────────────────────────────────
import express from "express";
import { protect }    from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  studentAlerts,
  teacherAlerts,
  hodAlerts,
  directorAlerts,
} from "../controllers/alerts.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Strict role guards — no role sees another role's alerts
router.get("/student",  allowRoles("student"),           studentAlerts);
router.get("/teacher",  allowRoles("teacher", "hod"),    teacherAlerts);
router.get("/hod",      allowRoles("hod"),               hodAlerts);
router.get("/director", allowRoles("director"),          directorAlerts);

export default router;