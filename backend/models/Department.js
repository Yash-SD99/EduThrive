import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],  //[condition, message]
      trim: true
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      uppercase: true,   // converts automatically to uppercase
      trim: true
    },

    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: [true, "Institute reference is required"]
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher"   // HOD will usually be a teacher
    },
    studentCounter: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Unique per institute (CSE can exist in different institutes)
departmentSchema.index({ code: 1, institute: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);