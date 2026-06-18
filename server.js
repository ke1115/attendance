const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Import database
const pool = require('./db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ====================================
// MIDDLEWARE
// ====================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// ====================================
// ROUTES
// ====================================

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Attendance Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            sessions: '/api/sessions',
            attendance: '/api/attendance'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        statusCode: 404
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500
    });
});

// ====================================
// START SERVER
// ====================================

app.listen(PORT, () => {
    console.log(`\n✓ Attendance Management System API`);
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Database: ${process.env.DB_NAME || 'attendance_system'}`);
    console.log('\nAvailable Endpoints:');
    console.log('  POST   /api/auth/student/signup');
    console.log('  POST   /api/auth/student/signin');
    console.log('  POST   /api/auth/lecturer/signin');
    console.log('  GET    /api/auth/user');
    console.log('  POST   /api/sessions');
    console.log('  GET    /api/sessions/class/:targetClass');
    console.log('  GET    /api/sessions/:sessionId');
    console.log('  GET    /api/sessions/lecturer/all');
    console.log('  PUT    /api/sessions/:sessionId/close');
    console.log('  POST   /api/attendance/mark');
    console.log('  GET    /api/attendance/student/history');
    console.log('  GET    /api/attendance/session/:sessionId');
    console.log('  GET    /api/attendance/export/:sessionId');
    console.log('  GET    /api/attendance/stats/:sessionId');
    console.log('  GET    /api/health\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
