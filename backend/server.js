import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import cors from "cors";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
import authRoutes from "./routes/auth.routes.js";
app.use("/api/auth", authRoutes);

import studentRoutes from "./routes/student.routes.js";
app.use("/api/student", studentRoutes);

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
