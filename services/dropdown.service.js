import db from "../config/db.js";

export const getDropdownOptions = async () => {

  try {

    /* =========================
       Fetch Master Tables
    ========================= */

    const [areas] = await db.query("SELECT area_name FROM areas_master");
    const [cities] = await db.query("SELECT city_name FROM cities_master");
    const [states] = await db.query("SELECT state_name FROM states_master");
    const [industries] = await db.query("SELECT industry_name FROM industries_master");
    const [skills] = await db.query("SELECT skill_name FROM skills_master");
    const [brands] = await db.query("SELECT brand_name FROM brands_master");
    const [languages] = await db.query("SELECT language_name FROM languages_master");
    const [marketTypes] = await db.query("SELECT market_type_name FROM market_types_master");
    const [jobTitles] = await db.query("SELECT job_title FROM job_titles_master");

    /* =========================
       Convert to arrays
    ========================= */

    const mapValues = (rows, key) => rows.map(r => r[key]).filter(Boolean);

    return {

      areas: mapValues(areas, "area_name").sort(),

      cities: mapValues(cities, "city_name").sort(),

      states: mapValues(states, "state_name").sort(),

      industries: mapValues(industries, "industry_name").sort(),

      skills: mapValues(skills, "skill_name").sort(),

      brands: mapValues(brands, "brand_name").sort(),

      languages: mapValues(languages, "language_name").sort(),

      market_types: mapValues(marketTypes, "market_type_name").sort(),

      job_titles: mapValues(jobTitles, "job_title").sort()

    };

  } catch (error) {

    console.error("Dropdown fetch error:", error);

    return {
      areas: [],
      cities: [],
      states: [],
      industries: [],
      skills: [],
      brands: [],
      languages: [],
      market_types: [],
      job_titles: []
    };

  }

};