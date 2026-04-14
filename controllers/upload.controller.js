import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import path from "path";

import parseResumeWithGemini from "../services/aiParser.js";
import insertMasterValues from "../services/insertMasterValues.js";
import convertWordToText from "../services/convertWordToText.js";
import db from "../config/db.js";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
});

const generateHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

export const uploadResume = async (req, res) => {
  upload.single("resume")(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const buffer = fs.readFileSync(req.file.path);
      const fileHash = generateHash(buffer);

      // DUPLICATE CHECK
      const [existing] = await db.execute(
        "SELECT id, resume_id FROM resumes WHERE file_hash = ?",
        [fileHash]
      );

      if (existing.length > 0) {
        return res.json({
          success: false,
          message: `Resume already exists with ID: ${existing[0].resume_id}`
        });
      }

      let extraData = {};
      if (req.body.extra_data) {
        extraData = JSON.parse(req.body.extra_data);
      }

      // INSERT
      const [insertResult] = await db.execute(
        `INSERT INTO resumes (file_hash, expected_job_role, status)
         VALUES (?, ?, ?)`,
        [fileHash, extraData.job_role || "", "pending"]
      );

      const id = insertResult.insertId;

      // GENERATE RESUME ID
      const resume_id = "RESUM" + String(id).padStart(4, "0");

      // SAVE FILE (UPDATED ✅)
      const ext = req.file.originalname.split(".").pop();
      const newPath = `uploads/${resume_id}.${ext}`;
      fs.renameSync(req.file.path, newPath);

      // UPDATE resume_id + file_path (UPDATED ✅)
      await db.execute(
        "UPDATE resumes SET resume_id = ?, file_path = ? WHERE id = ?",
        [resume_id, newPath, id]
      );

      // RESPONSE
      res.json({
        success: true,
        resume_id,
        id,
        status: "processing"
      });

      // BACKGROUND PROCESS
      (async () => {
        try {
          let parsedData;

          if (ext === "doc" || ext === "docx") {
            const text = await convertWordToText(newPath);
            parsedData = await parseResumeWithGemini(text, extraData, true);
          } else {
            parsedData = await parseResumeWithGemini(newPath, extraData);
          }

          // UPDATE FULL DATA
          await db.execute(
            `UPDATE resumes SET
              name = ?,
              phone = ?,
              email = ?,
              gender = ?,
              area = ?,
              city = ?,
              state = ?,
              skills = ?,
              languages = ?,
              experience_summary = ?,
              experience_years = ?,
              education = ?,
              current_job_title = ?,
              industry = ?,
              brand_and_retail_chain_experience = ?,
              market_type_experience = ?,
              product_experience_tags = ?,
              status = ?
            WHERE id = ?`,
            [
              parsedData.name || "",
              parsedData.phone || "",
              parsedData.email || "",
              parsedData.gender || "",
              parsedData.location?.area || "",
              parsedData.location?.city || "",
              parsedData.location?.state || "",
              JSON.stringify(parsedData.skills || []),
              JSON.stringify(parsedData.languages || []),
              parsedData.experience_summary || "",
              parsedData.experience_years || 0,
              parsedData.education || "",
              parsedData.current_role || "",
              JSON.stringify(parsedData.industry || []),
              JSON.stringify(parsedData.brand_and_retail_chain_experience || []),
              JSON.stringify(parsedData.market_type_experience || []),
              JSON.stringify(parsedData.product_experience_tags || []),
              "Active",
              id
            ]
          );

          // MASTER INSERT
          await insertMasterValues(
            db,
            "areas_master",
            "area_name",
            parsedData?.location?.area
          );

          await insertMasterValues(
            db,
            "languages_master",
            "language_name",
            parsedData?.languages
          );

          await insertMasterValues(
            db,
            "brands_master",
            "brand_name",
            parsedData?.brand_and_retail_chain_experience
          );

          console.log("✅ Master data inserted");

        } catch (err) {
          console.error("🔥 Background error:", err);
        }
      })();

    } catch (err) {
      console.error("🔥 FULL ERROR:", err);
      res.status(500).json({
        error: err.message || "Unknown error",
        stack: err.stack
      });
    }
  });
};