import express from "express";
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

//applied to all teacher routes
router.use(protect)
router.use(allowRoles("teacher"))

router.get("/dashboard", (req, res) => {
    res.json({ message: "Teacher dashboard OK" });
})

export default router