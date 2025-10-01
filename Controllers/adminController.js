import User from "../models/User.js";
import Hall from "../models/Hall.js";
import Exam from "../models/Exam.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";

/** ---------- CREATE ENDPOINTS ---------- */

// ✅ Create Student
export const createStudent = async (req, res) => {
  try {
    const { name, matricNumber, department, email } = req.body;

    // check duplicates
    if (await Student.findOne({ email })) {
      return res.status(400).json({ message: "Student already exists with this email" });
    }

    if (await Student.findOne({ matricNumber })) {
      return res.status(400).json({ message: "Student already exists with this matric number" });
    }

    const student = await Student.create({
      name,
      matricNumber,
      department,
      email
    });

    res.status(201).json({
      message: "Student created successfully",
      student
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Create Hall
export const createHall = async (req, res) => {
  try {
    const { name, location, capacity } = req.body;

    if (await Hall.findOne({ name })) {
      return res.status(400).json({ message: "Hall already exists with this name" });
    }

    const hall = await Hall.create({ name, location, capacity });
    res.status(201).json({ message: "Hall created successfully", hall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Create Exam
export const createExam = async (req, res) => {
  try {
    const { courseCode, courseTitle, date, duration } = req.body;

    if (!courseCode || !courseTitle || !date || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exam = await Exam.create({
      courseCode,
      courseTitle,
      date,
      duration
    });

    res.status(201).json({ message: "Exam created successfully", exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** ---------- LIST ENDPOINTS ---------- */

// ✅ List Students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ List Teachers
export const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ List Halls
export const getHalls = async (req, res) => {
  try {
    const halls = await Hall.find();
    res.json(halls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ List Exams
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
