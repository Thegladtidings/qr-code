import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseTitle: { type: String, required: true },
  duration: { type: String, required: true },
  date: { type: Date, required: true }
});

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
