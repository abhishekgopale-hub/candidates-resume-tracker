import { searchSQL } from "../services/sqlSearch.service.js";
import { getDropdownOptions } from "../services/dropdown.service.js";
import { generateExcel } from "../services/excel.service.js";
import db from "../config/db.js";
import "dotenv/config";
const BASE_URL = process.env.BASE_URL;

/* ================= GET USER ID FROM HEADER ================= */

const getUserIdFromAuth = async (authHeader) => {
  if (!authHeader) return null;
  
  try {
    const [users] = await db.execute(
      "SELECT id FROM users WHERE user_id = ?",
      [authHeader]
    );
    return users.length > 0 ? users[0].id : null;
  } catch (err) {
    console.error("Failed to get user ID:", err);
    return null;
  }
};

/* ================= NORMALIZE ================= */

const normalizeData = (rows) => {
  return rows.map((row) => {
    const clean = {};

    Object.keys(row).forEach((key) => {
      let value = row[key];

      try {
        if (typeof value === "string" && value.startsWith("[")) {
          value = JSON.parse(value).join(", ");
        } else if (Array.isArray(value)) {
          value = value.join(", ");
        }
      } catch {}

      if (key === "experience_years" && value != null) {
        const num = Number(value);
        value = Number.isInteger(num) ? num : Number(num.toFixed(2));
      }

      if (key === "status" && value === "parsed") {
        value = "active";
      }

      if (key === "created_at" && value) {
        try {
          value = new Date(value).toISOString().split("T")[0];
        } catch {}
      }

      if (key === "file_hash") return;

      clean[key] = value;
    });

    return clean;
  });
};

/* ================= SQL SEARCH ================= */

export const handleSQLSearch = async (req, res) => {
  try {
    const rawFilters = req.query;
    const filters = {};

    Object.keys(rawFilters).forEach((key) => {
      const cleanKey = key.replace("[]", "");
      if (rawFilters[key] === "") return;

      filters[cleanKey] = Array.isArray(rawFilters[key])
        ? rawFilters[key]
        : [rawFilters[key]];
    });

    console.log("🔍 RAW FILTERS:", rawFilters);
    console.log("🔍 CLEAN FILTERS:", filters);

    const rawResults = await searchSQL(filters);

    console.log("📊 RAW DB RESULTS:", rawResults);

    // ✅ ONLY CHANGE HERE (DOWNLOAD FIELD ADDED)
    const results = normalizeData(rawResults).map((row) => ({
      ...row,

      // ❌ hide file path
      file_path: undefined,

      // ✅ like status field
      download_resume: row.file_path ? "Download Resume" : "",

      // ✅ actual link for frontend
      download_link: row.file_path
        ? `/api/download/${row.id}`
        : ""
    }));

    console.log("✅ FINAL RESULTS:", results);

    // Log search action
    const authHeader = req.headers.authorization;
    const userId = await getUserIdFromAuth(authHeader);
    
    if (userId) {
      try {
        await db.execute(
          `INSERT INTO user_search_download_logs 
           (user_id, action_type, search_query, results_count, ip_address, action_time) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            'search',
            JSON.stringify(filters),
            results.length,
            req.ip || req.connection.remoteAddress
          ]
        );
        console.log(`✅ Search logged for user: ${authHeader}`);
      } catch (logErr) {
        console.error("❌ Failed to log search:", logErr.message);
      }
    } else {
      console.warn("⚠️ Could not identify user for logging");
    }

    res.json({ results });

  } catch (err) {
    console.error("❌ SQL SEARCH ERROR:", err);
    res.status(500).json({ error: "SQL search failed" });
  }
};

/* ================= DROPDOWN ================= */

export const handleDropdown = async (req, res) => {
  try {
    const data = await getDropdownOptions();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Dropdown fetch failed" });
  }
};

/* ================= EXPORT ================= */

export const exportSqlResults = async (req, res) => {
  try {
    const filters = {};

    Object.keys(req.body || {}).forEach((key) => {
      filters[key] = Array.isArray(req.body[key])
        ? req.body[key]
        : [req.body[key]];
    });

    const rawResults = await searchSQL(filters);

    const results = normalizeData(rawResults).map((row) => ({
      ...row,

      // hide file path
      file_path: undefined,

      // for UI label
      download_resume: row.file_path ? "Download Resume" : "",

      // backward compatibility (optional)
      download_link: row.file_path
        ? `/api/download/${row.id}`
        : "",

      // NEW correct field
      resume_link: row.file_path
        ? `/api/download/${row.id}`
        : ""
    }));

    // Log export/download action
    const authHeader = req.headers.authorization;
    const userId = await getUserIdFromAuth(authHeader);
    
    if (userId) {
      try {
        await db.execute(
          `INSERT INTO user_search_download_logs 
           (user_id, action_type, search_query, results_count, download_file_name, ip_address, action_time) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            'export',
            JSON.stringify(filters),
            results.length,
            'results.xlsx',
            req.ip || req.connection.remoteAddress
          ]
        );
        console.log(`✅ Export logged for user: ${authHeader}`);
      } catch (logErr) {
        console.error("❌ Failed to log export:", logErr.message);
      }
    } else {
      console.warn("⚠️ Could not identify user for logging");
    }

    const workbook = await generateExcel(results);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
};

/* ================= STATUS ================= */

export const updateCandidateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "Missing id or status" });
    }

    await db.execute(
      "UPDATE resumes SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
};
