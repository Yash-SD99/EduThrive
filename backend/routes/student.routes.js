import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

//applied to all student routes
router.use(protect);
router.use(allowRoles("student"));

router.get("/dashboard", (req, res) => {
    res.json({ message: "Student dashboard OK" });
});

export default router;