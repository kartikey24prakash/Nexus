import Item from "../models/item.model.js";
import { generateEmbedding, cosineSimilarity } from "../services/ai.service.js";

// ─── POST /api/search ──────────────────────────────────────────────────────────
// semantic search — finds items by meaning, not just keywords
export const semanticSearch = async (req, res, next) => {
  try {
    const { query, type, collection } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    // 1. embed the search query
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding.length) {
      return res.status(500).json({ success: false, message: "Failed to generate query embedding" });
    }

    // 2. fetch all items for this user that have embeddings
    const filter = { user: req.user._id, embedding: { $exists: true, $ne: [] } };
    if (type) filter.type = type;
    if (collection) filter.collection = collection;

    const items = await Item.find(filter)
      .select("-content")           // exclude full content — too heavy
      .populate("collection", "name color");

    if (!items.length) {
      return res.json({ success: true, results: [] });
    }

    // 3. compute cosine similarity for each item
    const scored = items
      .map((item) => ({
        item,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .filter((r) => r.score > 0.3)       // threshold — only return relevant results
      .sort((a, b) => b.score - a.score)  // highest similarity first
      .slice(0, 10)                        // top 10 results
      .map(({ item, score }) => ({
        ...item.toObject(),
        embedding: undefined,              // don't send embedding to frontend
        relevanceScore: Math.round(score * 100) / 100,
      }));

    res.json({
      success: true,
      query,
      results: scored,
      total: scored.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/search/keyword ───────────────────────────────────────────────────
// fallback keyword search — searches title and tags
export const keywordSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const filter = {
      user: req.user._id,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    };

    if (type) filter.type = type;

    const results = await Item.find(filter)
      .select("-embedding -content")
      .populate("collection", "name color")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, query: q, results, total: results.length });
  } catch (error) {
    next(error);
  }
};