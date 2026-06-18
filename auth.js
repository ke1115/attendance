const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login first.',
                statusCode: 401
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.',
            statusCode: 403
        });
    }
};

// Middleware to verify if user is a student
const verifyStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student role required.',
            statusCode: 403
        });
    }
};

// Middleware to verify if user is a lecturer
const verifyLecturer = (req, res, next) => {
    if (req.user && req.user.role === 'lecturer') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Lecturer role required.',
            statusCode: 403
        });
    }
};

module.exports = {
    verifyToken,
    verifyStudent,
    verifyLecturer
};
