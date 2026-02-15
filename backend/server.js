import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

// routes
import authRoutes from "./routes/auth.routes.js";
app.use("/api/auth", authRoutes);

import studentRoutes from "./routes/student.routes.js";
app.use("/api/student", studentRoutes);

import teacterRoutes from "./routes/teacher.routes.js"
app.use("/api/teacher", teacterRoutes)

import hodRoutes from "./routes/hod.routes.js"
app.use("/api/hod", hodRoutes)

import directorRoutes from "./routes/director.routes.js"
app.use("/api/director", directorRoutes)

// db
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
