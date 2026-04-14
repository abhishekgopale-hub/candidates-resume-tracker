const insertMasterValues = async (db, table, column, values) => {
  if (!values) return;

  if (!Array.isArray(values)) {
    try {
      values = JSON.parse(values);
    } catch {
      values = [values];
    }
  }

  for (let value of values) {
    if (!value) continue;

    if (Array.isArray(value)) {
      value = value[0];
    }

    const cleaned = String(value).trim().toLowerCase();

    if (!cleaned) continue;

    try {
      console.log(`📊 Master Insert → ${table}:`, cleaned);

      await db.execute(
        `INSERT IGNORE INTO ${table} (${column}) VALUES (?)`,
        [cleaned]
      );

    } catch (err) {
      console.error(`❌ Master Insert Error in ${table}:`, err.message);
    }
  }
};

export default insertMasterValues;