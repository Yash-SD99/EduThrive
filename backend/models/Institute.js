import mongoose from "mongoose";

const instituteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    establishedYear: {
        type: Number,
        required: true
    }
}, {timestamps: true})

export default mongoose.model("Institute", instituteSchema)