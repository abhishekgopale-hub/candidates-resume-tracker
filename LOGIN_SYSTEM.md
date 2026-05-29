# Login System & Visit Logging Documentation

## Overview
This system provides user authentication with a visit logging feature to track user access.

## Features
✅ User login with ID and password  
✅ Visit log tracking (login/logout times)  
✅ Session management  
✅ Visit history report  

---

## Setup Instructions

### 1. Initialize Database
Run this command once to create tables:

```bash
npm run init-db
```

This will:
- Create `users` table
- Create `visit_logs` table
- Create `user_search_download_logs` table

### 2. Update package.json
Add this script to your `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "init-db": "node scripts/initDB.js"
}
```

### 3. Start the Server
```bash
npm start
```

---

## API Endpoints

### 1. **Login** (Public)
**POST** `/api/auth/login`

**Request:**
```json
{
  "user_id": "your_user_id",
  "password": "your_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "user_name": "User Name",
    "user_id": "user_id"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid user ID or password"
}
```

---

### 2. **Check Auth Status** (Public)
**GET** `/api/auth/status`

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "user_name": "User Name",
    "user_id": "user_id",
    "loginTime": "2026-05-28T10:30:00.000Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

---

### 3. **Logout** (Public)
**POST** `/api/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4. **Get Visit Logs** (Protected - Requires Login)
**GET** `/api/auth/visit-logs?user_id=emp001`

**Parameters:**
- `user_id` (optional): Filter by specific user

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "user_name": "John Doe",
      "user_id": "emp001",
      "login_time": "2026-05-28 10:30:00",
      "logout_time": "2026-05-28 11:45:00",
      "ip_address": "192.168.1.100",
      "session_duration": 4500
    }
  ]
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Visit Logs Table
```sql
CREATE TABLE visit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL,
  ip_address VARCHAR(50),
  session_duration INT (GENERATED - calculated automatically),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_login_time (login_time)
)
```

---

## Protected Routes

These routes require authentication (must login first):
- `POST /api/upload/*`
- `GET /api/search/*`
- `POST /api/search/*`

**Example:**
```bash
# This will fail - not authenticated
curl http://localhost:5000/api/search/search-sql

# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"emp001","password":"abc@123"}'

# Now this works
curl http://localhost:5000/api/search/search-sql
```

---

## Adding New Users

### Option 1: Direct SQL
```sql
INSERT INTO users (user_name, user_id) VALUES ('New User', 'emp005');
```

### Option 2: Via Script
Edit `scripts/initDB.js` and add users to the `sampleUsers` array, then run:
```bash
npm run init-db
```

---

## Features to Implement

### Frontend Login Page (React)
```jsx
import { useState } from 'react';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, password })
    });

    const data = await response.json();
    if (data.success) {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      alert(data.error);
    }
  };

  return (
    <div>
      <input
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

---

## Troubleshooting

### ❌ "User ID not found"
- Verify the user_id exists in the database
- Run `npm run init-db` to insert sample users

### ❌ "Invalid password"
- Default password is: `abc@123`
- Password is case-sensitive

### ❌ "Unauthorized - Please login"
- Login first at `/api/auth/login`
- Session expires when server restarts (for now)

---

## Future Enhancements
- [ ] JWT token-based authentication
- [ ] Persistent session storage
- [ ] Password hashing (bcrypt)
- [ ] Role-based access control (RBAC)
- [ ] Two-factor authentication
- [ ] Session timeout
- [ ] Login history analytics
