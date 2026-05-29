import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/* ================= CREATE TABLES ================= */

const createTables = async () => {
  try {
    console.log("🔄 Creating database tables...");

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_name VARCHAR(255) NOT NULL,
        user_id VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created");

    // Create visit_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS visit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP NULL,
        ip_address VARCHAR(50),
        session_duration INT GENERATED ALWAYS AS (
          CASE 
            WHEN logout_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, login_time, logout_time)
            ELSE NULL
          END
        ) STORED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_login_time (login_time)
      )
    `);
    console.log("✅ Visit logs table created");

    // Create user_search_download_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_search_download_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        search_query LONGTEXT,
        results_count INT DEFAULT 0,
        download_file_id INT,
        download_file_name VARCHAR(255),
        ip_address VARCHAR(50),
        action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_action_time (action_time)
      )
    `);
    console.log("✅ User search/download logs table created");

    console.log("✅ All tables created successfully");

  } catch (err) {
    console.error("❌ Error creating tables:", err);
    process.exit(1);
  }
};

/* ================= INSERT SAMPLE USERS ================= */

const insertSampleUsers = async () => {
  try {
    console.log("\n🔄 Checking for sample users...");

    const [users] = await db.execute("SELECT COUNT(*) as count FROM users");

    if (users[0].count === 0) {
      console.log("📝 Inserting sample users...");

      const sampleUsers = [
        { user_name: "John Doe", user_id: "emp001" },
        { user_name: "Jane Smith", user_id: "emp002" },
        { user_name: "Mike Johnson", user_id: "emp003" },
        { user_name: "Sarah Williams", user_id: "emp004" }
      ];

      for (const user of sampleUsers) {
        await db.execute(
          "INSERT INTO users (user_name, user_id) VALUES (?, ?)",
          [user.user_name, user.user_id]
        );
      }

      console.log("✅ Sample users inserted");
    } else {
      console.log("ℹ️  Users already exist, skipping sample data");
    }

  } catch (err) {
    console.error("❌ Error inserting sample users:", err);
    process.exit(1);
  }
};

/* ================= INITIALIZE DB ================= */

const initializeDB = async () => {
  try {
    console.log("========= INITIALIZING DATABASE =========");
    await createTables();
    await insertSampleUsers();
    console.log("========= DATABASE READY =========\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
};

// Run initialization
initializeDB();
