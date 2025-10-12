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
export const getMyAssignments = async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    const assignments = await ExamAssignment.find({ teacher: teacherId })
      .populate({
        path: 'exam',
        select: 'courseCode courseTitle examDate startTime endTime duration'
      })
      .populate({
        path: 'hall',
        select: 'name capacity building floor'
      })
      .populate({
        path: 'teacher',
        select: 'name email'
      })
      .populate({
        path: 'students.student',
        select: 'name matricNumber email'
      })
      .sort({ 'exam.examDate': 1, 'exam.startTime': 1 }); // Sort by date and time
    
    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ 
        message: 'No assignments found for this teacher' 
      });
    }

    // Remove duplicates based on exam + hall combination
    const uniqueAssignments = assignments.filter((assignment, index, self) =>
      index === self.findIndex((a) => (
        a.exam._id.toString() === assignment.exam._id.toString() &&
        a.hall._id.toString() === assignment.hall._id.toString()
      ))
    );

    res.json(uniqueAssignments);
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ message: error.message });
  }
};
export const getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await ExamAssignment.findById(id)
      .populate('exam')
      .populate('hall')
      .populate('teacher')
      .populate('students.student');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Optional: Verify teacher owns this assignment
    if (req.user.role === 'teacher' && 
        assignment.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to view this assignment' 
      });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: error.message });
  }
};
// Get all registered students (for Admin)
export const getAllRegisteredStudents = async (req, res) => {
  try {
    // Check if user is admin (assuming you have role-based auth)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    // Get all students from the Student model
    const students = await Student.find()
      .select('name matric email level department createdAt')
      .sort({ createdAt: -1 });

    // Get count of students
    const totalStudents = await Student.countDocuments();

    res.json({
      message: "All registered students retrieved successfully",
      totalStudents,
      students
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get students by specific criteria (for Admin)
export const getStudentsByFilter = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    const { level, department, search } = req.query;
    let filter = {};

    // Build filter object
    if (level) filter.level = level;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { matric: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .select('name matric email level department createdAt')
      .sort({ createdAt: -1 });

    res.json({
      message: "Filtered students retrieved successfully",
      count: students.length,
      students
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all scanned students for a teacher
export const getScannedStudents = async (req, res) => {
  try {
    // Find all assignments where the teacher is assigned
    const assignments = await ExamAssignment.find({ 
      teacher: req.user._id 
    })
      .populate('exam', 'courseCode courseTitle date startTime endTime')
      .populate('hall', 'name location')
      .populate('students.student', 'name matric email level')
      .sort({ assignedAt: -1 });

    // Extract and organize scanned students
    let scannedStudents = [];
    let totalScanned = 0;
    let totalAssigned = 0;

    assignments.forEach(assignment => {
      const presentStudents = assignment.students.filter(s => s.isPresent);
      totalScanned += presentStudents.length;
      totalAssigned += assignment.students.length;

      presentStudents.forEach(s => {
        scannedStudents.push({
          student: s.student,
          exam: assignment.exam,
          hall: assignment.hall,
          scannedAt: assignment.assignedAt,
          assignmentId: assignment._id
        });
      });
    });

    res.json({
      message: "Scanned students retrieved successfully",
      summary: {
        totalAssignments: assignments.length,
        totalStudentsAssigned: totalAssigned,
        totalStudentsScanned: totalScanned,
        attendanceRate: totalAssigned > 0 
          ? ((totalScanned / totalAssigned) * 100).toFixed(2) + '%' 
          : '0%'
      },
      scannedStudents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get scanned students for a specific exam/assignment (for Teacher)
export const getScannedStudentsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    // Find assignments for this exam and this teacher
    const assignments = await ExamAssignment.find({
      teacher: req.user._id,
      exam: examId
    })
      .populate('exam', 'courseCode courseTitle date startTime endTime')
      .populate('hall', 'name location')
      .populate('students.student', 'name matric email level')
      .sort({ assignedAt: -1 });

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ 
        message: "No assignments found for this exam" 
      });
    }

    // Get all students (both scanned and not scanned)
    let allStudents = [];
    let scannedCount = 0;
    let notScannedCount = 0;

    assignments.forEach(assignment => {
      assignment.students.forEach(s => {
        allStudents.push({
          student: s.student,
          isPresent: s.isPresent,
          exam: assignment.exam,
          hall: assignment.hall,
          assignmentId: assignment._id
        });

        if (s.isPresent) {
          scannedCount++;
        } else {
          notScannedCount++;
        }
      });
    });

    res.json({
      message: "Students for exam retrieved successfully",
      summary: {
        totalStudents: allStudents.length,
        scannedStudents: scannedCount,
        notScannedStudents: notScannedCount,
        attendanceRate: allStudents.length > 0 
          ? ((scannedCount / allStudents.length) * 100).toFixed(2) + '%' 
          : '0%'
      },
      students: allStudents,
      examDetails: assignments[0]?.exam
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance statistics for teacher's dashboard
export const getTeacherAttendanceStats = async (req, res) => {
  try {
    const assignments = await ExamAssignment.find({ 
      teacher: req.user._id 
    })
      .populate('exam', 'courseCode courseTitle date')
      .populate('students.student');

    let stats = {
      totalExams: assignments.length,
      totalStudentsAssigned: 0,
      totalStudentsPresent: 0,
      examBreakdown: []
    };

    // Group by exam
    const examMap = new Map();

    assignments.forEach(assignment => {
      const examId = assignment.exam._id.toString();
      
      if (!examMap.has(examId)) {
        examMap.set(examId, {
          exam: assignment.exam,
          totalAssigned: 0,
          totalPresent: 0
        });
      }

      const examStats = examMap.get(examId);
      examStats.totalAssigned += assignment.students.length;
      examStats.totalPresent += assignment.students.filter(s => s.isPresent).length;

      stats.totalStudentsAssigned += assignment.students.length;
      stats.totalStudentsPresent += assignment.students.filter(s => s.isPresent).length;
    });

    // Convert map to array
    examMap.forEach((value) => {
      stats.examBreakdown.push({
        exam: value.exam,
        assigned: value.totalAssigned,
        present: value.totalPresent,
        attendanceRate: value.totalAssigned > 0 
          ? ((value.totalPresent / value.totalAssigned) * 100).toFixed(2) + '%' 
          : '0%'
      });
    });

    stats.overallAttendanceRate = stats.totalStudentsAssigned > 0 
      ? ((stats.totalStudentsPresent / stats.totalStudentsAssigned) * 100).toFixed(2) + '%' 
      : '0%';

    res.json({
      message: "Attendance statistics retrieved successfully",
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ADD THIS NEW BULK ASSIGNMENT FUNCTION
export const createBulkExamAssignment = async (req, res) => {
  try {
    const { studentIds, examId, hallId, teacherId } = req.body;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ 
        message: 'Student IDs array is required and must not be empty' 
      });
    }

    if (!examId || !hallId || !teacherId) {
      return res.status(400).json({ 
        message: 'Exam, hall, and teacher are required' 
      });
    }

    // Fetch exam, hall, and teacher details (verify they exist)
    const exam = await Exam.findById(examId);
    const hall = await Hall.findById(hallId);
    const teacher = await User.findById(teacherId);

    if (!exam || !hall || !teacher) {
      return res.status(404).json({ 
        message: "Exam, hall, or teacher not found" 
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    // Process each student
    for (const studentId of studentIds) {
      try {
        // Fetch student
        const student = await Student.findById(studentId);
        
        if (!student) {
          results.failed.push({
            studentId,
            error: 'Student not found',
          });
          continue;
        }

        // Check if assignment already exists for this student and exam
        const existingAssignment = await ExamAssignment.findOne({
          exam: examId,
          'students.student': studentId,
        });

        if (existingAssignment) {
          results.failed.push({
            studentId,
            error: 'Assignment already exists for this student and exam',
          });
          continue;
        }

        // Create assignment for this student
        const assignment = await ExamAssignment.create({
          exam: examId,
          hall: hallId,
          teacher: teacherId,
          students: [{ student: studentId, isPresent: false }]
        });

        // Generate QR code payload
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

        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload));
        
        assignment.qrCode = qrCodeData;
        await assignment.save();

        // Add to success results
        results.success.push({
          studentId,
          assignment: {
            _id: assignment._id,
            qrCode: assignment.qrCode,
            assignedAt: assignment.assignedAt,
          },
        });

      } catch (error) {
        console.error(`Error creating assignment for student ${studentId}:`, error);
        results.failed.push({
          studentId,
          error: error.message || 'Failed to create assignment',
        });
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all exam assignments (for Admin)
export const getAllExamAssignments = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    const assignments = await ExamAssignment.find()
      .populate('exam', 'courseCode courseTitle date startTime endTime')
      .populate('hall', 'name location capacity')
      .populate('teacher', 'name email department')
      .populate('students.student', 'name matric email level')
      .sort({ assignedAt: -1 });

    const totalAssignments = await ExamAssignment.countDocuments();

    res.json({
      message: "All exam assignments retrieved successfully",
      totalAssignments,
      assignments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get assignment by ID (for Admin)
export const getExamAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await ExamAssignment.findById(id)
      .populate('exam')
      .populate('hall')
      .populate('teacher')
      .populate('students.student');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({
      message: "Assignment retrieved successfully",
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete assignment (for Admin)
export const deleteExamAssignment = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    const { id } = req.params;

    const assignment = await ExamAssignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ 
      message: 'Assignment deleted successfully',
      deletedAssignment: assignment
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: error.message });
  }
};

