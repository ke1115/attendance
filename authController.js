const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');

// ====================================
// STUDENT AUTHENTICATION
// ====================================

// Student Sign Up
exports.studentSignUp = async (req, res) => {
    try {
        const { fullName, indexNumber, gender, classValue, password, confirmPassword } = req.body;

        // Validation
        if (!fullName || !indexNumber || !gender || !classValue || !password || !confirmPassword) {
            return res.status(400).json(
                formatErrorResponse('All fields are required.')
            );
        }

        if (password !== confirmPassword) {
            return res.status(400).json(
                formatErrorResponse('Passwords do not match.')
            );
        }

        if (password.length < 6) {
            return res.status(400).json(
                formatErrorResponse('Password must be at least 6 characters long.')
            );
        }

        // Check if index number already exists
        const conn = await pool.getConnection();
        try {
            const [existingUser] = await conn.query(
                'SELECT id FROM users WHERE index_number = ?',
                [indexNumber]
            );

            if (existingUser.length > 0) {
                return res.status(400).json(
                    formatErrorResponse('Index number already exists.')
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new student
            const [result] = await conn.query(
                'INSERT INTO users (full_name, index_number, gender, class, password_hash) VALUES (?, ?, ?, ?, ?)',
                [fullName, indexNumber, gender, classValue, hashedPassword]
            );

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: result.insertId,
                    indexNumber: indexNumber,
                    role: 'student'
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            return res.status(201).json(
                formatSuccessResponse(
                    { token, userId: result.insertId, indexNumber: indexNumber },
                    'Student registered successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Student Sign Up Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred during sign up.', 500)
        );
    }
};

// Student Sign In
exports.studentSignIn = async (req, res) => {
    try {
        const { indexNumber, password } = req.body;

        // Validation
        if (!indexNumber || !password) {
            return res.status(400).json(
                formatErrorResponse('Index number and password are required.')
            );
        }

        const conn = await pool.getConnection();
        try {
            // Find student
            const [users] = await conn.query(
                'SELECT id, full_name, index_number, gender, class, password_hash FROM users WHERE index_number = ?',
                [indexNumber]
            );

            if (users.length === 0) {
                return res.status(401).json(
                    formatErrorResponse('Invalid index number or password.')
                );
            }

            const user = users[0];

            // Compare passwords
            const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordMatch) {
                return res.status(401).json(
                    formatErrorResponse('Invalid index number or password.')
                );
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    indexNumber: user.index_number,
                    role: 'student'
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            return res.status(200).json(
                formatSuccessResponse(
                    {
                        token,
                        userId: user.id,
                        fullName: user.full_name,
                        indexNumber: user.index_number,
                        gender: user.gender,
                        class: user.class
                    },
                    'Student logged in successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Student Sign In Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred during sign in.', 500)
        );
    }
};

// ====================================
// LECTURER AUTHENTICATION
// ====================================

// Lecturer Sign In (No sign up - pre-seeded accounts only)
exports.lecturerSignIn = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json(
                formatErrorResponse('Username and password are required.')
            );
        }

        const conn = await pool.getConnection();
        try {
            // Find lecturer
            const [lecturers] = await conn.query(
                'SELECT id, full_name, username, password_hash FROM lecturers WHERE username = ?',
                [username]
            );

            if (lecturers.length === 0) {
                return res.status(401).json(
                    formatErrorResponse('Invalid username or password.')
                );
            }

            const lecturer = lecturers[0];

            // Compare passwords
            const isPasswordMatch = await bcrypt.compare(password, lecturer.password_hash);

            if (!isPasswordMatch) {
                return res.status(401).json(
                    formatErrorResponse('Invalid username or password.')
                );
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: lecturer.id,
                    username: lecturer.username,
                    role: 'lecturer'
                },
                process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            return res.status(200).json(
                formatSuccessResponse(
                    {
                        token,
                        lecturerId: lecturer.id,
                        fullName: lecturer.full_name,
                        username: lecturer.username
                    },
                    'Lecturer logged in successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Lecturer Sign In Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred during sign in.', 500)
        );
    }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        const conn = await pool.getConnection();
        try {
            if (role === 'student') {
                const [users] = await conn.query(
                    'SELECT id, full_name, index_number, gender, class FROM users WHERE id = ?',
                    [userId]
                );

                if (users.length === 0) {
                    return res.status(404).json(
                        formatErrorResponse('User not found.')
                    );
                }

                return res.status(200).json(
                    formatSuccessResponse(users[0], 'User data retrieved.')
                );
            } else if (role === 'lecturer') {
                const [lecturers] = await conn.query(
                    'SELECT id, full_name, username FROM lecturers WHERE id = ?',
                    [userId]
                );

                if (lecturers.length === 0) {
                    return res.status(404).json(
                        formatErrorResponse('Lecturer not found.')
                    );
                }

                return res.status(200).json(
                    formatSuccessResponse(lecturers[0], 'Lecturer data retrieved.')
                );
            }
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Get Current User Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred.', 500)
        );
    }
};
