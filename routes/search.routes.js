import express from "express";

import {
  handleSQLSearch,
  handleDropdown,
  exportSqlResults,
  updateCandidateStatus
} from "../controllers/search.controller.js";

const router = express.Router();

router.get("/search-sql", handleSQLSearch);
//router.post("/search-vector", handleVectorSearch);
router.get("/dropdown-options", handleDropdown);
router.post("/sql/export", exportSqlResults);
router.post("/candidate/status", updateCandidateStatus);

export default router;