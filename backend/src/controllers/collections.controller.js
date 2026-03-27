import Collection from "../models/collection.model.js";
import Item from "../models/item.model.js";

// ─── POST /api/collections ─────────────────────────────────────────────────────
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Collection name is required" });
    }

    const collection = await Collection.create({
      name,
      description: description || "",
      color: color || "#6366f1",
      user: req.user._id,
    });

    res.status(201).json({ success: true, collection });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/collections ──────────────────────────────────────────────────────
export const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    // attach item count to each collection
    const collectionsWithCount = await Promise.all(
      collections.map(async (col) => {
        const count = await Item.countDocuments({ collection: col._id });
        return { ...col.toObject(), itemCount: count };
      })
    );

    res.json({ success: true, collections: collectionsWithCount });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/collections/:id ──────────────────────────────────────────────────
export const getCollectionById = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    // get all items in this collection
    const items = await Item.find({ collection: collection._id })
      .select("-embedding")
      .sort({ createdAt: -1 });

    res.json({ success: true, collection, items });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/collections/:id ───────────────────────────────────────────────
export const updateCollection = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, description, color },
      { returnDocument: "after", runValidators: true }
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    res.json({ success: true, collection });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/collections/:id ──────────────────────────────────────────────
export const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    // remove collection reference from all items
    await Item.updateMany(
      { collection: collection._id },
      { $set: { collection: null } }
    );

    res.json({ success: true, message: "Collection deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/collections/:id/add-item ──────────────────────────────────────
// add an item to a collection
export const addItemToCollection = async (req, res, next) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "itemId is required" });
    }

    const item = await Item.findOneAndUpdate(
      { _id: itemId, user: req.user._id },
      { collection: req.params.id },
      { returnDocument: "after" }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/collections/:id/remove-item ───────────────────────────────────
// remove an item from a collection
export const removeItemFromCollection = async (req, res, next) => {
  try {
    const { itemId } = req.body;

    const item = await Item.findOneAndUpdate(
      { _id: itemId, user: req.user._id },
      { collection: null },
      { returnDocument: "after" }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};
