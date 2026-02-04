import mongoose from 'mongoose';

const hodSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
})

export default mongoose.model("Hod", hodSchema)