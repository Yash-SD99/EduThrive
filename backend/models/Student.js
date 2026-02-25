import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const studentSchema = new mongoose.Schema({
	firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        match: [/^\+?[1-9]\d{7,14}$/, "Invalid phone number"]
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },
    dateOfBirth: {
        type: Date
    },
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true,
		minlength: 6,
        validate: {
            validator: function (v) {
                // Password must have at least 1 uppercase, 1 lowercase, 1 number, 1 special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/.test(v);
            },
            message: props => "Password must be at least 6 characters and include uppercase, lowercase, number, and special character"
        }
	},
	role: {
		type: String,
		default: "student",
		immutable: true
	},
	institute: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Institute"
	},
	mustChangePassword: {
		type: Boolean,
		default: true
	},
	department: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Department",
		required: [true, "Department is required"]
	},
	sem: {
		type: Number,
		default: 1,
		min: 1,
		max: 8
	},
	rollNo: {
		type: String,
		unique: true,
		required: true
	}
}, { timestamps: true })

//HASH PASSWORD BEFORE SAVE
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//METHOD TO COMPARE PASSWORD
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Student", studentSchema)