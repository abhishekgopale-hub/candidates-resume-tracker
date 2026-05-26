/* =========================
   EXTRA DATA
========================= */

let extraData = {};

if (req.body.extra_data) {
  extraData = JSON.parse(req.body.extra_data);
}

/* ✅ CHECK LOG */

console.log("========== EXTRA DATA ==========");
console.log(extraData);
console.log("uploaded_by_name:", extraData.uploaded_by_name);
console.log("================================");


/* =========================
   INSERT
========================= */

const [insertResult] = await db.execute(

  `INSERT INTO resumes (

    file_hash,
    expected_job_role,
    status,
    uploaded_by_name

  )
  VALUES (?, ?, ?, ?)`,

  [

    fileHash,

    extraData.job_role || "",

    "pending",

    extraData.uploaded_by_name || ""

  ]
);

/* ✅ INSERT SUCCESS LOG */

console.log("========== INSERT SUCCESS ==========");
console.log("Resume Inserted");
console.log("Uploader Name:", extraData.uploaded_by_name);
console.log("====================================");
console.log("Insert Result:", insertResult);