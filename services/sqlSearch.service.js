import db from "../config/db.js";

export const searchSQL = async (filters) => {

  console.log("🔍 Filters received:", filters);

  let query = "SELECT * FROM resumes WHERE status IN ('Active', 'parsed')";
  const params = [];

  /* ==============================
     Helper for LIKE filters
  ============================== */

  const addLikeFilter = (column, values) => {

    if (!values || values.length === 0) return;

    query += " AND (";

    values.forEach((val, index) => {

      query += `LOWER(${column}) LIKE LOWER(?)`;

      if (index < values.length - 1) query += " OR ";

      params.push(`%${val}%`);

    });

    query += ")";

  };

  /* ==============================
     LOCATION (FIXED)
  ============================== */

  addLikeFilter("area", filters.areas);     // ✅ FIXED
  addLikeFilter("city", filters.cities);    // ✅ FIXED
  addLikeFilter("state", filters.states);   // ✅ OPTIONAL

  /* ==============================
     TEXT / JSON FIELDS (FIXED)
  ============================== */

  addLikeFilter("industry", filters.industries);
  addLikeFilter("market_type_experience", filters.market_types);
  addLikeFilter("skills", filters.skills);
  addLikeFilter("languages", filters.languages);
  addLikeFilter("brand_and_retail_chain_experience", filters.brands);

  /* ==============================
     EXPERIENCE RANGE
  ============================== */

  if (
    filters.min_experience !== undefined &&
    filters.max_experience !== undefined
  ) {

    query += " AND experience_years BETWEEN ? AND ?";
    params.push(Number(filters.min_experience));
    params.push(Number(filters.max_experience));

  }

  /* ==============================
     GENDER
  ============================== */

  let gender = filters.gender;

  if (Array.isArray(gender)) {
    gender = gender[0];
  }

  if (gender && gender !== "") {

    query += " AND gender = ?";
    params.push(gender);

  }

  /* ==============================
     DEBUG LOGS
  ============================== */

  console.log("🧠 FINAL SQL QUERY:", query);
  console.log("🧠 SQL PARAMS:", params);

  const [rows] = await db.execute(query, params);

  console.log("📊 RESULT COUNT:", rows.length);

  return rows;

};