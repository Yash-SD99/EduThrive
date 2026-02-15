import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "Missing credentials" });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign(
			{ id: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		res.cookie("accessToken", token, {
			httpOnly: true,      // JS cannot access it
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",  // CSRF protection
			maxAge: 24 * 60 * 60 * 1000 // 1 day
		});

		res.status(200).json({
			message: "Login successful",
			role: user.role // only for frontend UI logic
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("accessToken", {
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production", // true in production
	});

	res.status(200).json({ message: "Logged out successfully" });
};
