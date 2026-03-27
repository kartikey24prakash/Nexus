import Item from "../models/item.model.js";
import { generateEmbedding, cosineSimilarity } from "../services/ai.service.js";
import { searchItemChunks } from "../services/vector.service.js";

export const semanticSearch = async (req, res, next) => {
  try {
    const { query, type, collection } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const pineconeMatches = await searchItemChunks({
      query,
      userId: req.user._id,
      type,
      collectionId: collection,
      topK: 12,
    });

    if (pineconeMatches.length) {
      const itemIds = [...new Set(
        pineconeMatches
          .map(match => match.metadata?.itemId)
          .filter(Boolean)
      )];

      const items = await Item.find({
        _id: { $in: itemIds },
        user: req.user._id,
      })
        .select("-embedding -chunks -sourceData")
        .populate("collection", "name color");

      const itemMap = new Map(items.map(item => [String(item._id), item]));
      const seenItemIds = new Set();

      const results = pineconeMatches
        .map(match => {
          const item = itemMap.get(String(match.metadata?.itemId));
          if (!item || seenItemIds.has(String(item._id))) return null;

          seenItemIds.add(String(item._id));

          return {
            ...item.toObject(),
            relevanceScore: Math.round((match.score || 0) * 100) / 100,
            matchedChunk: {
              text: match.metadata?.text || "",
              chunkIndex: match.metadata?.chunkIndex ?? null,
            },
          };
        })
        .filter(Boolean);

      return res.json({
        success: true,
        query,
        results,
        total: results.length,
        mode: "pinecone",
      });
    }

    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding.length) {
      return res.status(500).json({ success: false, message: "Failed to generate query embedding" });
    }

    const filter = { user: req.user._id, embedding: { $exists: true, $ne: [] } };
    if (type) filter.type = type;
    if (collection) filter.collection = collection;

    const items = await Item.find(filter)
      .select("-content")
      .populate("collection", "name color");

    if (!items.length) {
      return res.json({ success: true, results: [] });
    }

    const scored = items
      .map((item) => ({
        item,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .filter((r) => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ item, score }) => ({
        ...item.toObject(),
        embedding: undefined,
        relevanceScore: Math.round(score * 100) / 100,
      }));

    res.json({
      success: true,
      query,
      results: scored,
      total: scored.length,
      mode: "fallback",
    });
  } catch (error) {
    next(error);
  }
};

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
