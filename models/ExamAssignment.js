import mongoose from "mongoose";

const examAssignmentSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },

  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true },

  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  students: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
      isPresent: { type: Boolean, default: false }
    }
  ],

  qrCode: { type: String }, // ✅ Base64 QR code

  assignedAt: { type: Date, default: Date.now }
});

const ExamAssignment = mongoose.model("ExamAssignment", examAssignmentSchema);
export default ExamAssignment;
