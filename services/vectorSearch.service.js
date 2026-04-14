import axios from "axios";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

/* ==============================
   Qdrant Client
============================== */

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  checkCompatibility: false
});

/* ==============================
   Gemini Prompt Parser
============================== */

const parseRecruiterPrompt = async (prompt) => {

  try {

    console.log("🟡 Prompt received:", prompt);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `
Return ONLY JSON.

{
"role":"",
"location":"",
"experience_years":0,
"skills":[],
"industry":[],
"brands":[]
}

Sentence:
${prompt}
`
          }]
        }],
        generationConfig: { temperature: 0 }
      }
    );

    let text = response.data.candidates[0].content.parts[0].text;

    console.log("🟡 Gemini raw response:", text);

    text = text.replace(/```json/g,"")
               .replace(/```/g,"")
               .trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if(start !== -1 && end !== -1){
      text = text.substring(start,end+1);
    }

    const parsed = JSON.parse(text);

    console.log("🟢 Parsed Prompt:", parsed);

    return parsed;

  } catch (error) {

    console.log("⚠ Gemini parse failed, using fallback");

    return {
      role:"",
      location:"",
      experience_years:0,
      skills:[],
      industry:[],
      brands:[],
      raw_prompt:prompt
    };

  }

};

/* ==============================
   Build Semantic Text
============================== */

const buildSemanticText = (data) => {

  const text = `
Role: ${data.role}

Industries: ${(data.industry || []).join(",")}

Brands: ${(data.brands || []).join(",")}

Skills: ${(data.skills || []).join(",")}

Location: ${data.location}

Experience: ${data.experience_years}

Summary: ${data.raw_prompt || ""}
`;

  console.log("🟢 Semantic Text:", text);

  return text;

};

/* ==============================
   Local Embedding
============================== */

const generateEmbedding = async (text) => {

  try {

    const response = await axios.post(
      "http://127.0.0.1:8000/embed",
      { text }
    );

    console.log("🟢 Embedding length:", response.data.vector.length);

    return response.data.vector;

  } catch (error) {

    console.error("❌ Embedding error:", error.message);

    throw error;

  }

};

/* ==============================
   Build Qdrant Filter
============================== */

const buildQdrantFilter = (filters = {}) => {

  const must = [];

  const addMatch = (key, values) => {

    if (!values || values.length === 0) return;

    values.forEach(v => {

      must.push({
        key,
        match: { value: v }
      });

    });

  };

  addMatch("city", filters.cities);
  addMatch("state", filters.states);
  addMatch("industry", filters.industries);
  addMatch("skills", filters.skills);
  addMatch("languages", filters.languages);

  addMatch("brand_and_retail_chain_experience", filters.brands);

  if (filters.gender) {

    must.push({
      key: "gender",
      match: { value: filters.gender }
    });

  }

  if (
    filters.min_experience !== undefined &&
    filters.max_experience !== undefined
  ) {

    must.push({
      key: "experience_years",
      range: {
        gte: Number(filters.min_experience),
        lte: Number(filters.max_experience)
      }
    });

  }

  const filter = must.length ? { must } : undefined;

  console.log("🟢 Qdrant Filter:", JSON.stringify(filter, null, 2));

  return filter;

};

/* ==============================
   FINAL VECTOR SEARCH
============================== */

export const searchVector = async (
  prompt,
  filters = {},
  page = 1,
  limit = 10
) => {

  try {

    console.log("🟡 Vector search start");

    const offset = (page - 1) * limit;

    let embedding;

    /* PROMPT SEARCH */

    if (prompt && prompt.trim() !== "") {

      const parsed = await parseRecruiterPrompt(prompt);

      const semantic = buildSemanticText(parsed);

      embedding = await generateEmbedding(semantic);

    }

    const qdrantFilter = buildQdrantFilter(filters);

    console.log("🟡 Running Qdrant search");

    const result = await qdrant.search("resumes", {

      vector: embedding || new Array(384).fill(0),

      limit: limit,

      offset: offset,

      filter: qdrantFilter,

      with_payload: true

    });

    console.log("🟢 Qdrant results count:", result.length);

    const formatted = result.map(r => ({
      score: r.score,
      ...r.payload
    }));

    return {
      results: formatted,
      page,
      limit
    };

  } catch (error) {

    console.error("❌ Vector Search Error:", error.message);

    return {
      results: [],
      page,
      limit
    };

  }

};