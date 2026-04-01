import mongoose from "mongoose";

const academicPolicySchema = new mongoose.Schema(
  {
    attendanceThreshold: {
      type: Number,
      default: 75, // 75%
      min: 0,
      max: 100,
    },

    passingMarks: {
      type: Number,
      default: 40, // 40%
      min: 0,
      max: 100,
    },

    assessmentWeightage: {
      Assignment: {
        type: Number,
        default: 10, // 10%
      },
      Quiz: {
        type: Number,
        default: 10, // 10%
      },
      Midterm: {
        type: Number,
        default: 30, // 30%
      },
      Final: {
        type: Number,
        default: 50, // 50%
      },
    },
  },
  { _id: false }
);

const instituteSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    establishedYear: {
      type: Number,
      required: true,
    },

    academicPolicy: {
      type: academicPolicySchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model("Institute", instituteSchema);