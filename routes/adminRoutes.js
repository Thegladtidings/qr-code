import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createStudent,
  createHall,
  createExam,
  getStudents,
  getTeachers,
  getHalls,
  getExams,
} from "../Controllers/adminController.js";

const router = express.Router();

// ---------- CREATE ----------
router.post("/students", protect, adminOnly, createStudent);
router.post("/halls", protect, adminOnly, createHall);
router.post("/exams", protect, adminOnly, createExam);

// ---------- LIST ----------
router.get("/students", protect, adminOnly, getStudents);
router.get("/teachers", protect, adminOnly, getTeachers);
router.get("/halls", protect, adminOnly, getHalls);
router.get("/exams", protect, adminOnly, getExams);

export default router;
// 