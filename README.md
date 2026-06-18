# Attendance Management System

A comprehensive web-based attendance tracking system with **geofencing validation** and real-time location-based marking. Built with Node.js/Express backend, MySQL database, and responsive HTML5/CSS3 frontend.

---

## 🎯 Features

### Student Features
✅ User registration and secure login  
✅ Real-time geofence-based attendance marking  
✅ Location validation using Haversine formula  
✅ Attendance history and records tracking  
✅ Class-based session filtering  

### Lecturer Features
✅ Pre-seeded secure login (no student registration)  
✅ Create attendance sessions with geofencing setup  
✅ Capture exact location coordinates via Geolocation API  
✅ Set custom geofence radius and time window  
✅ View detailed attendance records  
✅ Export attendance data to CSV  
✅ Session statistics and attendance percentage  

### Validation Logic
✅ **Class Matching**: Students can only mark attendance for their assigned class  
✅ **Duplication Prevention**: Each student marks attendance only once per session  
✅ **Time Window**: Attendance must be marked before session expiration  
✅ **Geofencing**: Haversine distance calculation ensures students are within radius  

---

## 🏗️ Project Structure

```
attendance-management-system/
│
├── database/
│   └── schema.sql              # Database setup and pre-seeded data
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── sessionController.js # Session management
│   │   └── attendanceController.js # Attendance marking & records
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── attendanceRoutes.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification & role-based access
│   ├── utils/
│   │   └── helpers.js          # Utility functions (Haversine, etc.)
│   ├── db.js                   # Database connection pool
│   ├── server.js               # Express server setup
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── index.html              # Landing page
    ├── signup.html             # Student sign-up form
    ├── login.html              # Login page (student/lecturer)
    ├── student-dashboard.html  # Student attendance interface
    ├── lecturer-dashboard.html # Lecturer management interface
    ├── styles.css              # Responsive styling
    └── script.js               # Frontend logic & API calls
```

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL |
| **Authentication** | JWT (JSON Web Tokens) |
| **Password Hashing** | bcryptjs |
| **Location** | Geolocation API (Browser), Haversine Formula |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm package manager
- Modern web browser with Geolocation support

### 1. Database Setup

```bash
# Open MySQL and run the schema
mysql -u root -p < database/schema.sql
```

Or manually import `database/schema.sql` into your MySQL client.

**Pre-seeded Lecturer Accounts:**
- Username: `lecturer1`, Password: `lecturer123`
- Username: `lecturer2`, Password: `lecturer456`

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env
# OR on Linux/Mac:
cp .env.example .env
```

**Edit `.env` with your configuration:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_system
DB_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=your_very_secret_key_change_this
CORS_ORIGIN=http://localhost:3000
```

**Start the server:**
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

**Simply open the frontend files in a web browser:**

Option 1: Use a local web server (recommended)
```bash
# Using Python 3
cd frontend
python -m http.server 3000

# Using Node.js http-server (install globally first)
npx http-server frontend -p 3000
```

Option 2: Direct file access
- Open `frontend/index.html` in your browser

**Access the application:**
- Home: `http://localhost:3000/index.html`
- Student Sign Up: `http://localhost:3000/signup.html`
- Login: `http://localhost:3000/login.html`

---

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Student Sign Up
```
POST /auth/student/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "indexNumber": "CS2024001",
  "gender": "Male",
  "classValue": "IT-A",
  "password": "password123",
  "confirmPassword": "password123"
}

Response (201):
{
  "success": true,
  "message": "Student registered successfully.",
  "data": {
    "token": "eyJhbGc...",
    "userId": 1,
    "indexNumber": "CS2024001"
  }
}
```

#### Student Sign In
```
POST /auth/student/signin
Content-Type: application/json

{
  "indexNumber": "CS2024001",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Student logged in successfully.",
  "data": {
    "token": "eyJhbGc...",
    "userId": 1,
    "fullName": "John Doe",
    "indexNumber": "CS2024001",
    "gender": "Male",
    "class": "IT-A"
  }
}
```

#### Lecturer Sign In
```
POST /auth/lecturer/signin
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "lecturer1",
  "password": "lecturer123"
}

Response (200):
{
  "success": true,
  "message": "Lecturer logged in successfully.",
  "data": {
    "token": "eyJhbGc...",
    "lecturerId": 1,
    "fullName": "Dr. John Smith",
    "username": "lecturer1"
  }
}
```

### Session Endpoints

#### Create Session (Lecturer)
```
POST /sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseTopic": "Database Design",
  "targetClass": "IT-A",
  "latitude": 6.9271,
  "longitude": 80.7743,
  "radiusMeters": 50,
  "timeWindowMinutes": 15
}

Response (201):
{
  "success": true,
  "message": "Attendance session created successfully.",
  "data": {
    "sessionId": 1,
    "courseTopic": "Database Design",
    "targetClass": "IT-A",
    "lecturerLocation": {
      "latitude": 6.9271,
      "longitude": 80.7743
    },
    "radiusMeters": 50,
    "timeWindowMinutes": 15,
    "expiresAt": "2026-06-16T10:30:00Z",
    "createdAt": "2026-06-16T10:15:00Z"
  }
}
```

#### Get Active Session by Class
```
GET /sessions/class/IT-A
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Session retrieved successfully.",
  "data": {
    "id": 1,
    "course_topic": "Database Design",
    "target_class": "IT-A",
    "lecturer_latitude": 6.9271,
    "lecturer_longitude": 80.7743,
    "radius_meters": 50,
    "time_window_minutes": 15,
    "expires_at": "2026-06-16T10:30:00Z",
    "session_status": "Active"
  }
}
```

### Attendance Endpoints

#### Mark Attendance
```
POST /attendance/mark
Content-Type: application/json
Authorization: Bearer <token>

{
  "sessionId": 1,
  "latitude": 6.9271,
  "longitude": 80.7743
}

Response (201):
{
  "success": true,
  "message": "Attendance marked successfully.",
  "data": {
    "recordId": 1,
    "sessionId": 1,
    "studentId": 1,
    "distance": 5.42,
    "allowedRadius": 50,
    "markedAt": "2026-06-16T10:20:00Z"
  }
}
```

#### Get Session Attendance (Lecturer)
```
GET /attendance/session/1
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Attendance records retrieved successfully.",
  "data": {
    "sessionId": 1,
    "totalPresent": 25,
    "records": [
      {
        "id": 1,
        "student_id": 1,
        "full_name": "John Doe",
        "index_number": "CS2024001",
        "gender": "Male",
        "class": "IT-A",
        "student_latitude": 6.9271,
        "student_longitude": 80.7743,
        "distance_meters": 5.42,
        "marked_at": "2026-06-16T10:20:00Z"
      }
    ]
  }
}
```

#### Export Attendance Data
```
GET /attendance/export/1
Authorization: Bearer <token>

Response (200):
Content-Type: text/csv
[CSV file download]
```

---

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcryptjs with salt rounds for secure password storage
3. **Role-Based Access Control**: Student and Lecturer role validation
4. **Unique Constraints**: Prevent duplicate attendance marking
5. **Input Validation**: Server-side validation for all inputs
6. **CORS**: Cross-Origin Resource Sharing configured for security
7. **Environment Variables**: Sensitive data stored in `.env` file

---

## 📍 Geofencing Implementation

### Haversine Formula
The system uses the Haversine formula to calculate the distance between lecturer and student locations:

```javascript
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) *
              Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}
```

### Location Accuracy
- **Browser Geolocation API**: Provides coordinates and accuracy radius
- **Frontend Validation**: Distance checked before submission
- **Backend Validation**: Secondary validation on server for security

---

## 🎓 Database Schema

### Users Table (Students)
```sql
- id: INT (Primary Key)
- full_name: VARCHAR(100)
- index_number: VARCHAR(50) UNIQUE
- gender: ENUM('Male', 'Female')
- class: ENUM('IT-A', 'IT-B', 'IT-C', 'IT-D')
- password_hash: VARCHAR(255)
- created_at: TIMESTAMP
```

### Lecturers Table
```sql
- id: INT (Primary Key)
- username: VARCHAR(100) UNIQUE
- password_hash: VARCHAR(255)
- full_name: VARCHAR(100)
- created_at: TIMESTAMP
```

### Attendance Sessions Table
```sql
- id: INT (Primary Key)
- lecturer_id: INT (Foreign Key)
- course_topic: VARCHAR(200)
- target_class: ENUM('IT-A', 'IT-B', 'IT-C', 'IT-D')
- lecturer_latitude: DECIMAL(10, 8)
- lecturer_longitude: DECIMAL(11, 8)
- radius_meters: INT
- time_window_minutes: INT
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- session_status: ENUM('Active', 'Expired', 'Closed')
```

### Attendance Records Table
```sql
- id: INT (Primary Key)
- session_id: INT (Foreign Key)
- student_id: INT (Foreign Key)
- student_latitude: DECIMAL(10, 8)
- student_longitude: DECIMAL(11, 8)
- marked_at: TIMESTAMP
- distance_meters: DECIMAL(10, 2)
- UNIQUE(session_id, student_id) - Prevent duplicates
```

---

## 🧪 Testing the System

### Student Workflow
1. Go to `http://localhost:3000/signup.html`
2. Register with details (Index Number must be unique)
3. Login with your credentials
4. Enable location sharing when browser prompts
5. Select available session and click "Mark Attendance"
6. System will validate class, location, time, and duplication
7. View your attendance history

### Lecturer Workflow
1. Go to `http://localhost:3000/login.html?role=lecturer`
2. Login with credentials:
   - Username: `lecturer1`
   - Password: `lecturer123`
3. Go to "Create Session" tab
4. Click "Get My Current Location" (enable location in browser)
5. Set geofence radius and time window
6. Create session
7. View attendance in "View Attendance" tab
8. Export data as CSV

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed
**Solution:**
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` file
- Ensure database was created: `CREATE DATABASE attendance_system;`

### Issue: Location Permission Denied
**Solution:**
- Check browser privacy settings allow geolocation
- Use HTTPS (some browsers restrict geolocation on HTTP)
- Clear browser cache and site data

### Issue: API Calls Failing with 401
**Solution:**
- Token may have expired (7 days default)
- Logout and login again
- Check JWT_SECRET in `.env` matches backend

### Issue: CORS Errors
**Solution:**
- Ensure `CORS_ORIGIN` in `.env` matches frontend URL
- For development, use `http://localhost:3000`

---

## 📊 Example Workflow

1. **Lecturer Creates Session:**
   - Topic: "Web Development Basics"
   - Class: IT-B
   - Location: Campus Room 201 (lat: 6.9271, lon: 80.7743)
   - Radius: 50m
   - Time Window: 15 minutes

2. **Student Attempts to Mark Attendance:**
   - Request received with student location
   - ✓ Class validation: IT-B matches IT-B
   - ✓ Time validation: Within 15 minutes
   - ✓ Geofence validation: Student is 12m away (< 50m)
   - ✓ Duplication check: First time marking this session
   - **Result: Attendance Marked Successfully**

3. **Lecturer Views Results:**
   - See 28 out of 30 students marked attendance (93.3%)
   - Export list with timestamps and distances
   - Can close session anytime

---

## 📄 License

This project is created for educational purposes.

---

## 👥 Support

For issues or questions, please review:
- Backend logs: Check console output from `npm start`
- Browser console: Check for JavaScript errors (F12)
- Database logs: Check MySQL error logs
- API responses: Use Postman to test endpoints

---

## 🔄 Future Enhancements

- SMS/Email notifications for session creation
- Real-time attendance dashboard with websockets
- Mobile app for iOS/Android
- QR code-based attendance verification
- Attendance analytics and reports
- Multi-factor authentication
- Session recording and playback

---

**Created:** June 2026  
**Version:** 1.0.0  
**Status:** Production Ready
