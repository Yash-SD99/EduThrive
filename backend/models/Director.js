import mongoose from 'mongoose';

const directorSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
})

export default mongoose.model("Director", directorSchema)