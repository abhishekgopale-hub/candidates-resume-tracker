import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/* =========================
   ENV CHECK
========================= */

console.log("========= DB CONFIG =========");

console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("DATABASE:", process.env.DB_NAME);

console.log("================================");

/* =========================
   CREATE POOL
========================= */

const db = mysql.createPool({

  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  connectTimeout: 10000,

  enableKeepAlive: true,

  keepAliveInitialDelay: 0

});

/* =========================
   TEST CONNECTION
========================= */

const testConnection = async () => {

  try {

    console.log("⏳ Testing database connection...");

    const connection = await db.getConnection();

    console.log("✅ DATABASE CONNECTED SUCCESSFULLY");

    const [rows] = await connection.query(
      "SELECT NOW() as currentTime"
    );

    console.log("✅ DATABASE TIME:", rows[0].currentTime);

    connection.release();

    console.log("✅ Connection released");

  } catch (err) {

    console.log("❌ DATABASE CONNECTION FAILED");

    console.log("ERROR CODE:", err.code);

    console.log("ERROR MESSAGE:", err.message);

    console.log("FULL ERROR:", err);

  }

};

/* =========================
   AUTO TEST ON SERVER START
========================= */

testConnection();

/* =========================
   PERIODIC HEALTH CHECK
========================= */

setInterval(async () => {

  try {

    const connection = await db.getConnection();

    await connection.query("SELECT 1");

    console.log("✅ DB HEALTH CHECK OK");

    connection.release();

  } catch (err) {

    console.log("❌ DB HEALTH CHECK FAILED");

    console.log("ERROR:", err.message);

  }

}, 30000);

/* =========================
   EXPORT
========================= */

export default db;