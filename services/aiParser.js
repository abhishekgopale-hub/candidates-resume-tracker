import axios from "axios";
import fs from "fs";
// ===============================
const MAX_RETRIES = 3;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ===============================
async function parseResumeWithGemini(input, extraData = {}, isText = false) {

  let base64File = "";
  let mimeType = "application/pdf";

  // ===============================
  // FILE HANDLING (ONLY IF NOT TEXT)
  // ===============================
  if (!isText) {
    const fileBuffer = fs.readFileSync(input);
    base64File = fileBuffer.toString("base64");

    const ext = input.split(".").pop().toLowerCase();

    if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "txt") mimeType = "text/plain";

    // ❌ IMPORTANT: DO NOT HANDLE DOCX HERE
  }

  // ===============================
  // PROMPT (UNCHANGED FULL)
  // ===============================
  const prompt = `
You are an expert resume parser. Return ONLY pure JSON.

STRICT OUTPUT RULES:
- Output must start with { and end with }
- No markdown, no explanation

User Preferences:
- Expected Role: ${extraData.job_role || ""}
- Preferred City: ${extraData.city || ""}
- Experience: ${extraData.experience_years || ""}

IMPORTANT PARSING RULES:

1) CURRENT ROLE:
- Must ONLY be selected from the predefined list below.
- If no exact match, return the closest matching role from the list.
- Do NOT create new roles.

2) EXPECTED ROLE:
- Must ONLY be selected from the SAME predefined list below.
- Extract from resume or user preference.
- Map to the closest matching role from the list.
- Do NOT create new roles.

Allowed ROLE values:
["Sales Executive","Sales Officer","Sales Representative","Senior Sales Rep","ISR","PSR (Pilot Sales Rep)","Business Development Manager","Key Account Manager","Key Account Development Executive","Sales Operations Analyst","Promoter","Field Promoter","Floating Promoter","Merchandiser","RX Merchandiser","Beauty Advisor","Sr. Beauty Advisor","Skin Care Expert","Makeup Artist","Derma Advisor","Derma Floater","Retail Area Manager","Visual Merchandising Manager","Store Manager","Area Manager","Zonal Manager","Regional Manager","Branch Manager","Team Leader","Supervisor","Field Manager","Field Supervisors","Operation Executive","Operations Manager","Project Manager","Project Co-ordinator","Program Manager","Program Coordinator","PO Coordinator","Admin Executive","Admin Manager","Branch Admin","Floater","HSA","Facilities Manager","Event Coordinator","Coordinator","Activity Manager","HR Executive","HR Manager","Talent Acquisition Executive","Trainer","Accountant","Accounts Manager","MIS (Management Information System)","Data Entry Operation","Billing Executive","Brand Executive","Demo Artist","ISP (In-Store Promoter)"]

3) SKILLS:
- Must ONLY be selected from predefined skills list

4) INDUSTRY:
- Must ONLY be selected from predefined list

5) GENDER:
- Only "Male" or "Female"

6) LOCATION + AREA LOGIC (KEEP SAME)

Return JSON:

{
"name": "",
"phone": "",
"email": "",
"gender": "",
"location": {"area": "", "city": "", "state": ""},
"skills": [],
"languages": [],
"experience_summary": "",
"experience_years": 0,
"education": "",
"current_role": "",
"expected_role": "",
"industry": [],
"brand_and_retail_chain_experience": [],
"market_type_experience": [],
"product_experience_tags": []
}
`;

  // ===============================
  // RETRY LOOP (UNCHANGED)
  // ===============================
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {

      console.log(`🤖 Gemini attempt ${attempt}...`);

      let parts = [
        { text: prompt }
      ];

      // ===============================
      // FILE MODE
      // ===============================
      if (!isText) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64File
          }
        });
      }

      // ===============================
      // TEXT MODE (WORD FILE FIX)
      // ===============================
      if (isText) {
        parts.push({
          text: input
        });
      }

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
        {
          contents: [{ parts }],
          generationConfig: {
            temperature: 0
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY
          }
        }
      );

      const rawText =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      console.log("📄 Raw Gemini Response:", rawText);

      const cleanText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanText);

      console.log("✅ Parsed JSON success");

      return parsed;

    } catch (error) {

      const status = error?.response?.status;

      console.error(
        `❌ Gemini error (attempt ${attempt}):`,
        error.response?.data || error.message
      );

      if (status === 503 && attempt < MAX_RETRIES) {
        console.log("⏳ Retrying...");
        await sleep(attempt * 2000);
        continue;
      }

      throw new Error("AI parsing failed after retries");
    }
  }
}

export default parseResumeWithGemini;