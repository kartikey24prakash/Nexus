import express from "express";
import { semanticSearch, keywordSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.post("/", semanticSearch);          // POST /api/search — semantic search
router.get("/keyword", keywordSearch);     // GET /api/search/keyword?q=term — keyword fallback

export default router;