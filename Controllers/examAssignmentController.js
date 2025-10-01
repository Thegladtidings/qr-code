import ExamAssignment from "../models/ExamAssignment.js";
import Student from "../models/Student.js";
import Exam from "../models/Exam.js";
import Hall from "../models/Hall.js";
import User from "../models/User.js"; // for teacher
import QRCode from "qrcode";

export const createExamAssignment = async (req, res) => {
  try {
    const { studentId, examId, hallId, teacherId } = req.body;

    // Fetch full details
    const student = await Student.findById(studentId);
    const exam = await Exam.findById(examId);
    const hall = await Hall.findById(hallId);
    const teacher = await User.findById(teacherId);

    if (!student || !exam || !hall || !teacher) {
      return res.status(404).json({ message: "One or more resources not found" });
    }

    // Create assignment
    const assignment = await ExamAssignment.create({
      exam: examId,
      hall: hallId,
      teacher: teacherId,
      students: [{ student: studentId, isPresent: false }]
    });

    // Generate QR code with READABLE URL that contains assignment ID
    const qrPayload = {
      assignmentId: assignment._id.toString(),
      exam: {
        id: exam._id.toString(),
        courseCode: exam.courseCode,
        courseTitle: exam.courseTitle,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime
      },
      hall: {
        id: hall._id.toString(),
        name: hall.name,
        location: hall.location,
        capacity: hall.capacity
      },
      teacher: {
        id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      },
      students: [{
        id: student._id.toString(),
        name: student.name,
        matric: student.matric,
        email: student.email,
        level: student.level
      }],
      assignedAt: assignment.assignedAt
    };

    // Generate QR code with the JSON payload
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));
    
    assignment.qrCode = qrCodeData;
    await assignment.save();

    res.status(201).json({
      message: "Exam assigned to student successfully",
      assignment: {
        ...assignment.toObject(),
        exam,
        hall,
        teacher,
        students: [{ student, isPresent: false }]
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Keep your existing markAttendanceByQR controller as is
export const markAttendanceByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    const { assignmentId, exam, hall, students } = qrData;

    if (!assignmentId || !exam?.id || !hall?.id || !students?.length) {
      return res.status(400).json({ message: "Invalid QR data" });
    }

    // Find the assignment by ID for faster lookup
    const assignment = await ExamAssignment.findById(assignmentId)
      .populate('exam')
      .populate('hall')
      .populate('teacher')
      .populate('students.student');

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify the teacher scanning is the assigned teacher
    if (assignment.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "You are not authorized to mark attendance for this assignment" 
      });
    }

    // Mark each student from QR as present
    let updatedStudents = [];
    for (const student of students) {
      const studentEntry = assignment.students.find(
        (s) => s.student._id.toString() === student.id
      );

      if (studentEntry) {
        studentEntry.isPresent = true;
        updatedStudents.push(student.name);
      }
    }

    await assignment.save();

    res.json({
      message: `Attendance marked for ${updatedStudents.length} student(s)`,
      presentStudents: updatedStudents,
      assignment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get assignment details (for viewing)
export const getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await ExamAssignment.findById(req.params.id)
      .populate('exam')
      .populate('hall')
      .populate('teacher')
      .populate('students.student');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};