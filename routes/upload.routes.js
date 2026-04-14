import express from "express";
import { uploadResume } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", uploadResume);

export default router;