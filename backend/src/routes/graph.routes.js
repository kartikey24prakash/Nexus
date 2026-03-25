import express from "express";
import { getGraph, getClusters } from "../controllers/graph.controller.js";

const router = express.Router();

router.get("/", getGraph);            // GET /api/graph — nodes + edges
router.get("/clusters", getClusters); // GET /api/graph/clusters — topic clusters

export default router;