import express from "express";
import { getResurfaceItem } from "../controllers/resurface.controller.js";


const router = express.Router();

// GET /api/resurface
router.get("/", getResurfaceItem);

export default router;