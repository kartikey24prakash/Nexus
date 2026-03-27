import Item from "../models/item.model.js";
import { findRelatedItems } from "../services/ai.service.js";
import { buildPendingItemData } from "../services/ingest.service.js";
import { enqueueItemIngest } from "../queues/ingest.queue.js";

// save a new item - URL or PDF upload
export const saveItem = async (req, res, next) => {
  try {
    const { url, type: manualType, collectionId } = req.body;
    const file = req.file;

    if (!url && !file) {
      return res.status(400).json({ success: false, message: "URL or file is required" });
    }

    const pendingItem = await buildPendingItemData({
      url,
      manualType,
      file,
    });

    const item = await Item.create({
      ...pendingItem,
      user: req.user._id,
      collection: collectionId || null,
    });

    void enqueueItemIngest(item._id);

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

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
      .select("-embedding")
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

    const allItems = await Item.find({ user: req.user._id }).select(
      "_id title thumbnail type tags embedding"
    );
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

export const addHighlight = async (req, res, next) => {
  try {
    const { text, note } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Highlight text is required" });
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $push: { highlights: { text, note: note || "" } } },
      { returnDocument: "after" }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, highlights: item.highlights });
  } catch (error) {
    next(error);
  }
};

export const deleteHighlight = async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $pull: { highlights: { _id: req.params.highlightId } } },
      { returnDocument: "after" }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, highlights: item.highlights });
  } catch (error) {
    next(error);
  }
};
