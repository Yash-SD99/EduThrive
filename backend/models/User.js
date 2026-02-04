import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "teacher", "hod", "director"],
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

export default mongoose.model("User", userSchema);
