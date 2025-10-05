import express from "express";
import {
  createExamAssignment,
  getAssignmentDetails,
  markAttendanceByQR,
  getAllRegisteredStudents,
  getStudentsByFilter,
  getScannedStudents,
  getScannedStudentsByExam,
  getTeacherAttendanceStats,
  getMyAssignments
} from "../Controllers/examAssignmentController.js";
import { protect, adminOnly, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== ADMIN ROUTES ====================
// Create exam assignment
router.post("/", protect, adminOnly, createExamAssignment);

// View all registered students
router.get("/students/all", protect, adminOnly, getAllRegisteredStudents);

// Filter students by level, department, or search
router.get("/students/filter", protect, adminOnly, getStudentsByFilter);

// ==================== TEACHER ROUTES ====================
// Get teacher's assignments
router.get("/my-assignments", protect, teacherOnly, getMyAssignments);

// Mark attendance via QR code scan
router.post("/attendance", protect, teacherOnly, markAttendanceByQR);

// Get all students that have been scanned by this teacher
router.get("/scanned-students", protect, teacherOnly, getScannedStudents);

// Get scanned students for a specific exam
router.get("/scanned-students/exam/:examId", protect, teacherOnly, getScannedStudentsByExam);

// Get attendance statistics for teacher dashboard
router.get("/attendance-stats", protect, teacherOnly, getTeacherAttendanceStats);

// ==================== SHARED ROUTES ====================
// Get specific assignment details (both admin and teacher can view)
router.get("/:id", protect, getAssignmentDetails);

export default router;