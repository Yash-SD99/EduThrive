import jwt from "jsonwebtoken";
import Director from "../models/Director.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Institute from "../models/Institute.js";

// ================================
// Login
// ================================
export const login = async (req, res) => {
  try {
    const { code } = req.params;
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    // Find institute by code
    const institute = await Institute.findOne({ code: code.toUpperCase() });
    if (!institute) return res.status(404).json({ message: "Institute not found" });

    // Map role to model
    const modelMap = { director: Director, hod: Teacher, teacher: Teacher, student: Student };
    const Model = modelMap[role];
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    // Find user scoped to institute
    const user = await Model.findOne({ email, institute: institute._id });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Validate role and password
    if (user.role !== role) return res.status(403).json({ message: "Unauthorized for this role" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, institute: user.institute },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cross-site cookie
    res.cookie("accessToken", token, {
      httpOnly: true,          // JS cannot access it
      secure: true,            // HTTPS only
      sameSite: "none",        // allow cross-site
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      message: "Login successful",
      role: user.role, // for frontend redirect
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================================
// Logout
// ================================
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({ message: "Logged out successfully" });
};