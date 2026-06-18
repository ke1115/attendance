const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, verifyLecturer } = require('../middleware/auth');

// Create session (Lecturer only)
router.post('/', verifyToken, verifyLecturer, sessionController.createSession);

// Get all sessions for lecturer
router.get('/lecturer/all', verifyToken, verifyLecturer, sessionController.getLecturerSessions);

// Get active session by class
router.get('/class/:targetClass', verifyToken, sessionController.getActiveSessionByClass);

// Get session details
router.get('/:sessionId', verifyToken, sessionController.getSessionDetails);

// Close session (Lecturer only)
router.put('/:sessionId/close', verifyToken, verifyLecturer, sessionController.closeSession);

module.exports = router;
