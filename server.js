import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;
import express from "express";
import cors from "cors";
import db from "./config/db.js";

import uploadRoutes from "./routes/upload.routes.js";
import searchRoutes from "./routes/search.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { requireAuth } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Public APIs
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

// Protected APIs (require login)
app.use("/api/search", requireAuth, searchRoutes);
app.get("/api/masters", async (req, res) => {
  const [cities] = await db.execute("SELECT city_name FROM cities_master");
  const [roles] = await db.execute("SELECT job_title FROM job_titles_master");

  res.json({
    cities: cities.map(x => x.city_name),
    roles: roles.map(x => x.job_title)
  });
});

app.get("/api/download/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT file_path FROM resumes WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length || !rows[0].file_path) {
      return res.status(404).send("File not found");
    }

    res.download(rows[0].file_path);
  } catch (err) {
    console.error(err);
    res.status(500).send("Download error");
  }
});


// health
app.get("/", (req, res) => {
  res.send("Super Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});