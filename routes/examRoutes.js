import express from "express";
import {
  createExamAssignment,
  getAssignmentDetails,
  markAttendanceByQR
} from "../Controllers/examAssignmentController.js";
import { protect, adminOnly, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin
router.post("/", protect, adminOnly, createExamAssignment);

// Teacher
router.get("/my-assignments", protect, teacherOnly, getAssignmentDetails);
router.post("/attendance", protect, teacherOnly, markAttendanceByQR);

export default router;
