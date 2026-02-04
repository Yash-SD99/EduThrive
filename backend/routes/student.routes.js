import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("student"),
  (req, res) => {
    res.json({ message: "Student dashboard OK" });
  }
);

export default router;
