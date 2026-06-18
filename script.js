/* ====================================
   ATTENDANCE MANAGEMENT SYSTEM - SCRIPT
   ==================================== */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// ====================================
// UTILITY FUNCTIONS
// ====================================

// Store token in localStorage
function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Store user data in localStorage
function setUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

// Get user data from localStorage
function getUserData() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
}

// Clear all stored data (logout)
function clearAllData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Get request headers with token
function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} show">
            ${message}
        </div>
    `;
    
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) element.remove();
        }, 5000);
    }
}

// Show loading indicator
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loader"></div>';
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return getToken() !== null;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Logout function
function logout() {
    clearAllData();
    window.location.href = 'index.html';
}

// ====================================
// GEOLOCATION FUNCTIONS
// ====================================

// Get current user location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let errorMessage = 'Unable to get your location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'The request to get user location timed out.';
                        break;
                }
                reject(new Error(errorMessage));
            }
        );
    });
}

// Calculate Haversine distance (frontend validation)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100;
}

// ====================================
// API FUNCTIONS - Authentication
// ====================================

// Student Sign Up
async function studentSignUp(fullName, indexNumber, gender, classValue, password, confirmPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/student/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName,
                indexNumber,
                gender,
                classValue,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Sign up failed.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Student Sign In
async function studentSignIn(indexNumber, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/student/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                indexNumber,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Sign in failed.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Lecturer Sign In
async function lecturerSignIn(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/lecturer/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Sign in failed.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get current user
async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/user`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get user data.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// ====================================
// API FUNCTIONS - Sessions
// ====================================

// Create attendance session (Lecturer)
async function createAttendanceSession(courseTopic, targetClass, latitude, longitude, radiusMeters, timeWindowMinutes) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                courseTopic,
                targetClass,
                latitude,
                longitude,
                radiusMeters,
                timeWindowMinutes
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create session.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get lecturer sessions
async function getLecturerSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/lecturer/all`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get sessions.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get active session for a class
async function getActiveSessionByClass(targetClass) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/class/${targetClass}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'No active session found.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get session details
async function getSessionDetails(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get session details.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Close session (Lecturer)
async function closeSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/close`, {
            method: 'PUT',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to close session.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// ====================================
// API FUNCTIONS - Attendance
// ====================================

// Mark attendance
async function markAttendance(sessionId, latitude, longitude) {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                sessionId,
                latitude,
                longitude
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark attendance.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get student attendance history
async function getStudentAttendanceHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/student/history`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get attendance history.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Get session attendance (Lecturer)
async function getSessionAttendance(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/session/${sessionId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get session attendance.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Export attendance data (Lecturer)
async function exportAttendanceData(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/export/${sessionId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to export data.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_session_${sessionId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        throw error;
    }
}

// Get attendance statistics (Lecturer)
async function getAttendanceStats(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/stats/${sessionId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get statistics.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// ====================================
// PAGE INITIALIZATION
// ====================================

// Initialize page based on route
function initPage() {
    const page = document.body.getAttribute('data-page');

    if (page === 'student-dashboard' || page === 'lecturer-dashboard') {
        requireAuth();
        updateNavbar();
    }
}

// Update navbar with user info
function updateNavbar() {
    const user = getUserData();
    if (user) {
        const navbarUser = document.getElementById('navbar-user');
        if (navbarUser) {
            navbarUser.innerHTML = `<strong>${user.fullName || user.indexNumber || user.username}</strong>`;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPage);
