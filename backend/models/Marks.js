import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true
    },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

marksSchema.index({institute: 1, student: 1, assessment: 1 }, { unique: true });

marksSchema.index({ institute: 1, student: 1 });
marksSchema.index({institute: 1, assessment: 1 });

export default mongoose.model("Marks", marksSchema);