import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  hallNumber: { type: String, required: true }, // ✅ added hall number
  assignedAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
