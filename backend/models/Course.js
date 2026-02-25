import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Course Name is Required"],
        trim: true
    },
    code: {
        type: String,
        required: [true, "course code is required"],
        trim: true,
        uppercase: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    credits: {
        type: Number,
        required: [true, "Course Credits are required"],
        min: 0,
        max: 4
    },
    semester: {
        type: Number,
        required: [true, "Course semester is required"],
        min: 1,
        max: 8
    }
}, {timestamps: true})

// Unique course code per institute
courseSchema.index({ code: 1, institute: 1 }, { unique: true });

//For performance
courseSchema.index({ department: 1, institute: 1 });

export default mongoose.model("Course", courseSchema)