const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/student/signup', authController.studentSignUp);
router.post('/student/signin', authController.studentSignIn);
router.post('/lecturer/signin', authController.lecturerSignIn);

// Protected routes
router.get('/user', verifyToken, authController.getCurrentUser);

module.exports = router;
