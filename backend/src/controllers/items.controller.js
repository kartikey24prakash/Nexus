import Item from "../models/item.model.js";
import { detectType, scrapeContent, scrapePdf } from "../services/scraper.service.js";
import { generateTags, generateEmbedding, findRelatedItems } from "../services/ai.service.js";

// ─── POST /api/items ───────────────────────────────────────────────────────────
// save a new item — URL or PDF upload
export const saveItem = async (req, res, next) => {
  try {
    const { url, type: manualType, collectionId } = req.body;
    const file = req.file; // for PDF uploads via multer

    if (!url && !file) {
      return res.status(400).json({ success: false, message: "URL or file is required" });
    }

    let title, content, thumbnail, type;

    if (file) {
      if (file.mimetype.startsWith("image/")) {
        // ── Image upload ──────────────────────────────────────────────────
        type = "image";
        title = file.originalname || "Image";
        content = "";
        thumbnail = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      } else {
        // ── PDF upload ────────────────────────────────────────────────────
        type = "pdf";
        const result = await scrapePdf(file.buffer);
        title = result.title;
        content = result.content;
        thumbnail = result.thumbnail;
      }
    }
    else {
      // ── URL save ────────────────────────────────────────────────────────────
      type = manualType || detectType(url);
      const result = await scrapeContent(url, type);
      title = result.title;
      content = result.content;
      thumbnail = result.thumbnail;
    }

    // ── AI processing (runs in parallel for speed) ──────────────────────────
    const embeddingText = `${title} ${content}`;
    const [tags, embedding] = await Promise.all([
      generateTags(title, content),
      generateEmbedding(embeddingText),
    ]);

    // ── Save to MongoDB ──────────────────────────────────────────────────────
    const item = await Item.create({
      url: url || `pdf-upload-${Date.now()}`,
      type,
      title,
      content,
      thumbnail,
      tags,
      embedding,
      user: req.user._id,
      collection: collectionId || null,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/items ────────────────────────────────────────────────────────────
// get all saved items for logged-in user
export const getItems = async (req, res, next) => {
  try {
    const { type, collection, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (collection) filter.collection = collection;

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-embedding") // don't send embedding to frontend — large array
      .populate("collection", "name color");

    const total = await Item.countDocuments(filter);

    res.json({
      success: true,
      items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/items/:id ────────────────────────────────────────────────────────
// get single item + related items
export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("collection", "name color");

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // find related items using embeddings
    const allItems = await Item.find({ user: req.user._id }).select("_id title thumbnail type tags embedding");
    const related = findRelatedItems(item.embedding, allItems, item._id);

    res.json({
      success: true,
      item,
      related,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/items/:id ────────────────────────────────────────────────────
export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/items/:id/highlight ──────────────────────────────────────────
// add a highlight to an item
export const addHighlight = async (req, res, next) => {
  try {
    const { text, note } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Highlight text is required" });
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $push: { highlights: { text, note: note || "" } } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, highlights: item.highlights });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/items/:id/highlight/:highlightId ─────────────────────────────
// remove a highlight
export const deleteHighlight = async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $pull: { highlights: { _id: req.params.highlightId } } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, highlights: item.highlights });
  } catch (error) {
    next(error);
  }
};