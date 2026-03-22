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
  institute: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Institute",
  required: true
},
}, { timestamps: true });

// Prevent duplicate sections
sectionSchema.index(
  { course: 1, sectionName: 1, academicYear: 1 },
  { unique: true }
);

// Performance indexes
sectionSchema.index({institute: 1, course: 1 });
sectionSchema.index({institute: 1, teacher: 1 });
sectionSchema.index({institute: 1, course: 1, academicYear: 1, currentStrength: 1 });

export default mongoose.model("Section", sectionSchema);