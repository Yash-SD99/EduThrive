import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institute",
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Assignment", "Quiz", "Midterm", "Final"],
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

assessmentSchema.index({ institute: 1, section: 1 });

export default mongoose.model("Assessment", assessmentSchema);