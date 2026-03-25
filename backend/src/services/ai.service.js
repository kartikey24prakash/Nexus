import dotenv from "dotenv";
dotenv.config();
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";

// ─── Initialize models ────────────────────────────────────────────────────────
const getChatModel = () => new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

const getEmbeddingModel = () => new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",    // updated
  apiKey: process.env.GOOGLE_API_KEY,
});


// ─── Generate tags ────────────────────────────────────────────────────────────
// takes title + content, returns array of 3-5 tags
export const generateTags = async (title, content) => {
  try {
    const chatModel = getChatModel()
    const text = `Title: ${title}\n\nContent: ${content.slice(0, 2000)}`;

    const response = await chatModel.invoke([
      new SystemMessage(
        `You are a tagging assistant. Given a piece of content, return ONLY a JSON array of 3 to 5 short lowercase tags that best describe the topic. 
        No explanation. No markdown. Only the JSON array.
        Example output: ["machine learning", "python", "neural networks"]`
      ),
      new HumanMessage(text),
    ]);

    const raw = response.content.trim();

    // strip markdown code fences if Gemini adds them
    const cleaned = raw.replace(/```json|```/g, "").trim();

    const tags = JSON.parse(cleaned);

    // make sure it's an array of strings
    if (!Array.isArray(tags)) return [];
    return tags.map((t) => t.toLowerCase().trim()).slice(0, 5);
  } catch (error) {
    console.error("[AI] Tag generation failed:", error.message);
    return []; // fail silently — item still saves without tags
  }
};

// ─── Generate embedding ───────────────────────────────────────────────────────
// takes text, returns array of numbers (vector)
export const generateEmbedding = async (text) => {
  try {
    const embeddingModel = getEmbeddingModel()
    // combine title + content for richer embedding
    const input = text.slice(0, 3000); // token limit safety
    const embedding = await embeddingModel.embedQuery(input);
    return embedding;
  } catch (error) {
    console.error("[AI] Embedding generation failed:", error.message);
    return []; // fail silently — item still saves without embedding
  }
};

// ─── Cosine similarity ────────────────────────────────────────────────────────
// compares two vectors, returns score between 0 and 1
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};

// ─── Find related items ───────────────────────────────────────────────────────
// given one item's embedding, find top N similar items from a list
export const findRelatedItems = (targetEmbedding, allItems, excludeId, topN = 3) => {
  return allItems
    .filter((item) => item._id.toString() !== excludeId.toString())
    .filter((item) => item.embedding?.length > 0)
    .map((item) => ({
      item,
      score: cosineSimilarity(targetEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ item }) => item);
};