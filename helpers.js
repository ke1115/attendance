// Haversine Formula: Calculate distance between two geographic points
// Returns distance in meters
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

    return Math.round(distance * 100) / 100; // Return distance in meters, rounded to 2 decimal places
}

// Format error response
function formatErrorResponse(message, statusCode = 400) {
    return {
        success: false,
        message: message,
        statusCode: statusCode
    };
}

// Format success response
function formatSuccessResponse(data, message = 'Success') {
    return {
        success: true,
        message: message,
        data: data
    };
}

// Get current UTC timestamp
function getCurrentTimestamp() {
    return new Date();
}

// Calculate expiration time based on time window (in minutes)
function calculateExpirationTime(timeWindowMinutes) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeWindowMinutes);
    return now;
}

// Check if session has expired
function isSessionExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

module.exports = {
    calculateHaversineDistance,
    formatErrorResponse,
    formatSuccessResponse,
    getCurrentTimestamp,
    calculateExpirationTime,
    isSessionExpired
};
