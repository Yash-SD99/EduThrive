import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  sectionName: {
    type: String,
    required: true,
    uppercase: true,
    enum: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  },
  academicYear: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  currentStrength: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true });

// Prevent duplicate sections
sectionSchema.index(
  { course: 1, sectionName: 1, academicYear: 1 },
  { unique: true }
);

// Performance indexes
sectionSchema.index({ course: 1 });
sectionSchema.index({ teacher: 1 });
sectionSchema.index({ course: 1, academicYear: 1, currentStrength: 1 });

export default mongoose.model("Section", sectionSchema);