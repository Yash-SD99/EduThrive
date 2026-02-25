import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true
    },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
  },

}, { timestamps: true });

//One student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

//One student per section
enrollmentSchema.index({ student: 1, section: 1 }, { unique: true });

enrollmentSchema.index({ section: 1 });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({course: 1})

export default mongoose.model("Enrollment", enrollmentSchema);