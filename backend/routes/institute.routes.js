import express from "express";
import { registerInstitute } from "../controllers/institute.controller.js";

const router = express.Router();

// Public route — no auth middleware required
router.post("/register", registerInstitute);

export default router;