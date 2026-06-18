const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, verifyStudent, verifyLecturer } = require('../middleware/auth');

// Mark attendance (Student only)
router.post('/mark', verifyToken, verifyStudent, attendanceController.markAttendance);

// Get attendance history for student
router.get('/student/history', verifyToken, verifyStudent, attendanceController.getStudentAttendanceHistory);

// Get session attendance (Lecturer only)
router.get('/session/:sessionId', verifyToken, verifyLecturer, attendanceController.getSessionAttendance);

// Export attendance data (Lecturer only)
router.get('/export/:sessionId', verifyToken, verifyLecturer, attendanceController.exportAttendanceData);

// Get attendance statistics (Lecturer only)
router.get('/stats/:sessionId', verifyToken, verifyLecturer, attendanceController.getAttendanceStats);

module.exports = router;
