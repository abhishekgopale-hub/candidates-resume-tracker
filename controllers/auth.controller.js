import db from "../config/db.js";
import "dotenv/config";

const COMMON_PASSWORD = "abc@123";

/* ================= LOGIN ================= */

export const handleLogin = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    // Validate input
    if (!user_id || !password) {
      return res.status(400).json({ error: "User ID and password required" });
    }

    // Check if user exists in database
    const [users] = await db.execute(
      "SELECT id, user_name, user_id FROM users WHERE user_id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid user ID" });
    }

    // Verify password (common for all: abc@123)
    if (password !== COMMON_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const user = users[0];

    // Log the visit in user_login_logs
    try {
      await db.execute(
        "INSERT INTO user_login_logs (user_id, login_time, ip_address) VALUES (?, NOW(), ?)",
        [user.id, req.ip || req.connection.remoteAddress]
      );
      console.log(`✅ Login logged for user: ${user.user_id}`);
    } catch (logErr) {
      console.warn("⚠️ Failed to log visit:", logErr);
    }

    // Return user data (frontend will store this)
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        user_name: user.user_name,
        user_id: user.user_id
      }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

/* ================= LOGOUT ================= */

export const handleLogout = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Get user id from user_id
    const [users] = await db.execute(
      "SELECT id FROM users WHERE user_id = ?",
      [user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const userId = users[0].id;

    // Update logout time in latest login record
    try {
      await db.execute(
        "UPDATE user_login_logs SET logout_time = NOW() WHERE user_id = ? AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1",
        [userId]
      );
      console.log(`✅ Logout logged for user: ${user_id}`);
    } catch (logErr) {
      console.warn("⚠️ Failed to log logout:", logErr);
    }

    res.json({ success: true, message: "Logged out successfully" });

  } catch (err) {
    console.error("❌ LOGOUT ERROR:", err);
    res.status(500).json({ error: "Logout failed" });
  }
};

/* ================= GET LOGIN LOGS ================= */

export const getLoginLogs = async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = `
      SELECT l.id, u.user_name, u.user_id, l.login_time, l.logout_time, 
             l.ip_address, l.session_duration
      FROM user_login_logs l
      JOIN users u ON l.user_id = u.id
    `;

    const params = [];

    if (user_id) {
      query += " WHERE u.user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY l.login_time DESC LIMIT 100";

    const [logs] = await db.execute(query, params);

    res.json({ success: true, logs });

  } catch (err) {
    console.error("❌ GET LOGIN LOGS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch login logs" });
  }
};
