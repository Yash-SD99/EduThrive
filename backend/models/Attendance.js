import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
	section: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Section",
		required: true
	},
	date: {
		type: Date,
		required: true
	},
	records: [
		{
			student: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Student"
			},
			status: {
				type: String,
				enum: ["present", "absent"],
				required: true
			}
		}
	],
	markedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Teacher"
	},
	institute: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Institute"
	}
}, { timestamps: true });

//One attendance of a section per day
attendanceSchema.index( { institute: 1, section: 1, date: 1 }, { unique: true });
export default mongoose.model("Attendance", attendanceSchema);