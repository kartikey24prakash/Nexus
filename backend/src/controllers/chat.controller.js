import { answerQuestionWithRag } from "../services/rag.service.js";
import Collection from "../models/collection.model.js";
import Item from "../models/item.model.js";

export const askQuestion = async (req, res, next) => {
  try {
    const { question, type, collection, itemId } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    if (collection) {
      const collectionDoc = await Collection.findOne({
        _id: collection,
        user: req.user._id,
      }).select("_id");

      if (!collectionDoc) {
        return res.status(404).json({
          success: false,
          message: "Collection not found",
        });
      }
    }

    if (itemId) {
      const itemDoc = await Item.findOne({
        _id: itemId,
        user: req.user._id,
      }).select("_id");

      if (!itemDoc) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }
    }

    const result = await answerQuestionWithRag({
      question,
      userId: req.user._id,
      type,
      collectionId: collection,
      itemId,
    });

    res.json({
      success: true,
      question,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
