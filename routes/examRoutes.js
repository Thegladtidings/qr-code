import express from "express";
import {
  createExamAssignment,
  createBulkExamAssignment,  // NEW: Bulk assignment
  getAssignmentDetails,
  markAttendanceByQR,
  getAllRegisteredStudents,
  getStudentsByFilter,
  getScannedStudents,
  getScannedStudentsByExam,
  getTeacherAttendanceStats,
  getMyAssignments,
  getAllExamAssignments,      // NEW: Get all assignments (admin)
  getExamAssignmentById,      // NEW: Get single assignment (admin)
  deleteExamAssignment        // NEW: Delete assignment (admin)
} from "../Controllers/examAssignmentController.js";
import { protect, adminOnly, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== ADMIN ROUTES ====================
// Create single exam assignment
router.post("/", protect, adminOnly, createExamAssignment);

// NEW: Create bulk exam assignments
router.post("/bulk", protect, adminOnly, createBulkExamAssignment);

// NEW: Get all exam assignments
router.get("/all", protect, adminOnly, getAllExamAssignments);

// NEW: Delete exam assignment
router.delete("/:id", protect, adminOnly, deleteExamAssignment);

// View all registered students
router.get("/students/all", protect, adminOnly, getAllRegisteredStudents);

// Filter students by level, department, or search
router.get("/students/filter", protect, adminOnly, getStudentsByFilter);

router.get("/assignment/:id", protect, adminOnly, getExamAssignmentById);

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
// NOTE: This should be at the end to avoid conflicting with other routes
router.get("/:id", protect, getAssignmentDetails);

export default router;