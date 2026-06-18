const pool = require('../db');
const { formatErrorResponse, formatSuccessResponse, calculateHaversineDistance, isSessionExpired } = require('../utils/helpers');

// ====================================
// ATTENDANCE OPERATIONS
// ====================================

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { sessionId, latitude, longitude } = req.body;

        // Validation
        if (!sessionId || latitude === undefined || longitude === undefined) {
            return res.status(400).json(
                formatErrorResponse('Session ID, latitude, and longitude are required.')
            );
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json(
                formatErrorResponse('Invalid geographic coordinates.')
            );
        }

        const conn = await pool.getConnection();
        try {
            // Get student info
            const [students] = await conn.query(
                'SELECT id, class FROM users WHERE id = ?',
                [studentId]
            );

            if (students.length === 0) {
                return res.status(404).json(
                    formatErrorResponse('Student not found.')
                );
            }

            const studentClass = students[0].class;

            // Get session info
            const [sessions] = await conn.query(
                'SELECT id, target_class, lecturer_latitude, lecturer_longitude, radius_meters, expires_at, session_status FROM attendance_sessions WHERE id = ?',
                [sessionId]
            );

            if (sessions.length === 0) {
                return res.status(404).json(
                    formatErrorResponse('Session not found.')
                );
            }

            const session = sessions[0];

            // VALIDATION 1: Check class match
            if (studentClass !== session.target_class) {
                return res.status(403).json(
                    formatErrorResponse(`Your class (${studentClass}) does not match the session's target class (${session.target_class}).`)
                );
            }

            // VALIDATION 2: Check if session is expired
            if (isSessionExpired(session.expires_at) || session.session_status === 'Closed') {
                return res.status(403).json(
                    formatErrorResponse('This attendance session has expired or is closed.')
                );
            }

            // VALIDATION 3: Check if student already marked attendance
            const [existingAttendance] = await conn.query(
                'SELECT id FROM attendance_records WHERE session_id = ? AND student_id = ?',
                [sessionId, studentId]
            );

            if (existingAttendance.length > 0) {
                return res.status(403).json(
                    formatErrorResponse('You have already marked attendance for this session.')
                );
            }

            // VALIDATION 4: Check geofencing (distance from lecturer)
            const distance = calculateHaversineDistance(
                session.lecturer_latitude,
                session.lecturer_longitude,
                latitude,
                longitude
            );

            if (distance > session.radius_meters) {
                return res.status(403).json(
                    formatErrorResponse(`You are ${Math.round(distance)}m away from the required location. Maximum allowed distance is ${session.radius_meters}m.`)
                );
            }

            // All validations passed - mark attendance
            const [result] = await conn.query(
                'INSERT INTO attendance_records (session_id, student_id, student_latitude, student_longitude, distance_meters) VALUES (?, ?, ?, ?, ?)',
                [sessionId, studentId, latitude, longitude, distance]
            );

            return res.status(201).json(
                formatSuccessResponse(
                    {
                        recordId: result.insertId,
                        sessionId,
                        studentId,
                        distance: distance,
                        allowedRadius: session.radius_meters,
                        markedAt: new Date()
                    },
                    'Attendance marked successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Mark Attendance Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred while marking attendance.', 500)
        );
    }
};

// Get attendance records for a session
exports.getSessionAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const lecturerId = req.user.id;

        const conn = await pool.getConnection();
        try {
            // Verify session belongs to lecturer
            const [sessions] = await conn.query(
                'SELECT id, lecturer_id FROM attendance_sessions WHERE id = ?',
                [sessionId]
            );

            if (sessions.length === 0) {
                return res.status(404).json(
                    formatErrorResponse('Session not found.')
                );
            }

            if (sessions[0].lecturer_id !== lecturerId) {
                return res.status(403).json(
                    formatErrorResponse('You do not have permission to view this session\'s attendance.')
                );
            }

            // Get attendance records
            const [records] = await conn.query(
                `SELECT 
                    ar.id,
                    ar.student_id,
                    u.full_name,
                    u.index_number,
                    u.gender,
                    u.class,
                    ar.student_latitude,
                    ar.student_longitude,
                    ar.distance_meters,
                    ar.marked_at
                FROM attendance_records ar
                JOIN users u ON ar.student_id = u.id
                WHERE ar.session_id = ?
                ORDER BY ar.marked_at DESC`,
                [sessionId]
            );

            return res.status(200).json(
                formatSuccessResponse(
                    {
                        sessionId,
                        totalPresent: records.length,
                        records: records
                    },
                    'Attendance records retrieved successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Get Session Attendance Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred while retrieving attendance records.', 500)
        );
    }
};

// Get attendance history for a student
exports.getStudentAttendanceHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        const conn = await pool.getConnection();
        try {
            const [records] = await conn.query(
                `SELECT 
                    ar.id,
                    ar.session_id,
                    as.course_topic,
                    as.target_class,
                    as.created_at as session_created_at,
                    ar.marked_at,
                    ar.distance_meters,
                    as.radius_meters
                FROM attendance_records ar
                JOIN attendance_sessions as ON ar.session_id = as.id
                WHERE ar.student_id = ?
                ORDER BY ar.marked_at DESC`,
                [studentId]
            );

            return res.status(200).json(
                formatSuccessResponse(
                    {
                        studentId,
                        totalAttended: records.length,
                        records: records
                    },
                    'Attendance history retrieved successfully.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Get Student Attendance History Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred while retrieving attendance history.', 500)
        );
    }
};

// Export attendance data (CSV format)
exports.exportAttendanceData = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const lecturerId = req.user.id;

        const conn = await pool.getConnection();
        try {
            // Verify session belongs to lecturer
            const [sessions] = await conn.query(
                'SELECT id, lecturer_id, course_topic, target_class, created_at FROM attendance_sessions WHERE id = ?',
                [sessionId]
            );

            if (sessions.length === 0) {
                return res.status(404).json(
                    formatErrorResponse('Session not found.')
                );
            }

            if (sessions[0].lecturer_id !== lecturerId) {
                return res.status(403).json(
                    formatErrorResponse('You do not have permission to export this session\'s data.')
                );
            }

            // Get attendance records
            const [records] = await conn.query(
                `SELECT 
                    u.full_name,
                    u.index_number,
                    u.gender,
                    u.class,
                    ar.student_latitude,
                    ar.student_longitude,
                    ar.distance_meters,
                    ar.marked_at
                FROM attendance_records ar
                JOIN users u ON ar.student_id = u.id
                WHERE ar.session_id = ?
                ORDER BY ar.marked_at ASC`,
                [sessionId]
            );

            // Generate CSV content
            const csvHeader = 'Full Name,Index Number,Gender,Class,Latitude,Longitude,Distance (meters),Marked At\n';
            const csvRows = records.map(record => 
                `"${record.full_name}","${record.index_number}","${record.gender}","${record.class}",${record.student_latitude},${record.student_longitude},${record.distance_meters},"${record.marked_at}"`
            ).join('\n');

            const csvContent = csvHeader + csvRows;

            // Set response headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_session_${sessionId}.csv"`);
            res.send(csvContent);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Export Attendance Data Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred while exporting data.', 500)
        );
    }
};

// Get attendance statistics for a session
exports.getAttendanceStats = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const lecturerId = req.user.id;

        const conn = await pool.getConnection();
        try {
            // Verify session belongs to lecturer
            const [sessions] = await conn.query(
                'SELECT id, lecturer_id, target_class FROM attendance_sessions WHERE id = ?',
                [sessionId]
            );

            if (sessions.length === 0) {
                return res.status(404).json(
                    formatErrorResponse('Session not found.')
                );
            }

            if (sessions[0].lecturer_id !== lecturerId) {
                return res.status(403).json(
                    formatErrorResponse('You do not have permission to view this session\'s statistics.')
                );
            }

            const targetClass = sessions[0].target_class;

            // Get total students in class
            const [classStats] = await conn.query(
                'SELECT COUNT(*) as total_students FROM users WHERE class = ?',
                [targetClass]
            );

            // Get attendance count
            const [attendanceStats] = await conn.query(
                'SELECT COUNT(*) as total_present FROM attendance_records WHERE session_id = ?',
                [sessionId]
            );

            const totalStudents = classStats[0].total_students;
            const totalPresent = attendanceStats[0].total_present;
            const totalAbsent = totalStudents - totalPresent;
            const attendancePercentage = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(2) : 0;

            return res.status(200).json(
                formatSuccessResponse(
                    {
                        sessionId,
                        targetClass,
                        totalStudents,
                        totalPresent,
                        totalAbsent,
                        attendancePercentage: `${attendancePercentage}%`
                    },
                    'Attendance statistics retrieved.'
                )
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Get Attendance Stats Error:', error);
        return res.status(500).json(
            formatErrorResponse('An error occurred while retrieving statistics.', 500)
        );
    }
};
