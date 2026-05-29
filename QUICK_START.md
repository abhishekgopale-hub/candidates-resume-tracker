# Quick Start Guide - Login System

## 🚀 Quick Setup (5 minutes)

### Step 1: Initialize Database
```bash
npm run init-db
```

This creates 4 sample users:
- User ID: `emp001` | Name: John Doe
- User ID: `emp002` | Name: Jane Smith  
- User ID: `emp003` | Name: Mike Johnson
- User ID: `emp004` | Name: Sarah Williams

**Password for all users:** `abc@123`

### Step 2: Start Server
```bash
npm start
```

The server runs on `http://localhost:5000`

---

## 🧪 Test Login (Using Postman or cURL)

### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "emp001",
    "password": "abc@123"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "user_name": "John Doe",
    "user_id": "emp001"
  }
}
```

---

## 📊 Key Features

### ✅ Login System
- Login with User ID + Password (abc@123)
- Returns user details on success
- Blocks unauthorized access

### ✅ Visit Logging
- Automatically logs login time
- Logs logout time when user logs out
- Calculates session duration
- Records IP address

### ✅ Protected Routes
All these routes now require login:
- `/api/search/*` - All search operations
- `/api/upload/*` - All upload operations

### ✅ View Visit Logs
Get all visit history:
```bash
curl http://localhost:5000/api/auth/visit-logs
```

Get specific user's history:
```bash
curl http://localhost:5000/api/auth/visit-logs?user_id=emp001
```

---

## 📁 New Files Created

```
controllers/
  ├── auth.controller.js       (Login logic)
routes/
  ├── auth.routes.js           (Auth endpoints)
middleware/
  ├── auth.middleware.js       (Auth protection)
scripts/
  ├── initDB.js               (Database setup)
```

---

## 🔐 How It Works

1. **User Login**
   ```
   POST /api/auth/login
   → Verify User ID exists
   → Verify Password (abc@123)
   → Log visit entry
   → Return user info
   ```

2. **Protected Routes**
   ```
   GET /api/search/search-sql
   → Check if user is logged in
   → Allow if authenticated
   → Deny if not logged in
   ```

3. **Visit Tracking**
   ```
   On Login → Insert: login_time, ip_address
   On Logout → Update: logout_time
   Result → session_duration calculated automatically
   ```

---

## 📊 Sample Visit Log Entry

```json
{
  "id": 1,
  "user_name": "John Doe",
  "user_id": "emp001",
  "login_time": "2026-05-28 10:30:00",
  "logout_time": "2026-05-28 11:45:00",
  "ip_address": "192.168.1.100",
  "session_duration": 4500  // seconds
}
```

---

## ⚠️ Important Notes

1. **Session Management**
   - Currently uses in-memory sessions
   - Sessions reset when server restarts
   - For production, use Redis or database sessions

2. **Password**
   - Currently plain text: `abc@123`
   - For production, use bcrypt hashing

3. **Security**
   - Add HTTPS/SSL in production
   - Use JWT tokens for better security
   - Implement rate limiting on login endpoint

---

## 🆘 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Make sure MySQL is running and `.env` has correct DB credentials

### "User ID not found"
**Solution:** 
1. Run `npm run init-db` again
2. Check user exists: `SELECT * FROM users;`

### "Invalid password"
**Solution:** Default password is exactly: `abc@123` (case-sensitive)

---

## 📚 Full Documentation
See `LOGIN_SYSTEM.md` for complete API reference and advanced usage.
