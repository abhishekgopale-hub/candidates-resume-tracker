import express from "express";
import {
  handleLogin,
  handleLogout,
  getLoginLogs
} from "../controllers/auth.controller.js";

const router = express.Router();

// Public routes
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/login-logs", getLoginLogs);

export default router;
