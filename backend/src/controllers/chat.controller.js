import { answerQuestionWithRag } from "../services/rag.service.js";

export const askQuestion = async (req, res, next) => {
  try {
    const { question, type, collection } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const result = await answerQuestionWithRag({
      question,
      userId: req.user._id,
      type,
      collectionId: collection,
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
