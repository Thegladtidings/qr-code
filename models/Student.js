import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matricNumber: { type: String, unique: true, required: true },
  department: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  level: { type: String }
});

const Student = mongoose.model("Student", studentSchema);

export default Student;
