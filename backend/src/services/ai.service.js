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
    const chatModel = getChatModel();

    const text = `Title: ${title}\n\nContent: ${content.slice(0, 2000)}`;

    const response = await chatModel.invoke([
      new SystemMessage(`
You are an intelligent tagging system.

Generate 5 to 8 high-quality tags for the given content.

Rules:
- lowercase only
- each tag = 1 to 3 words
- mix of topic + concept + context
- avoid duplicates or similar wording
- no symbols, no punctuation
- return ONLY a JSON array
Example:
["ai", "machine learning", "neural networks", "tutorial"]
      `),
      new HumanMessage(text),
    ]);

    const raw = response.content?.toString().trim() || "";

    // clean markdown / junk
    const cleaned = raw
      .replace(/```json|```/g, "")
      .replace(/[\n\r]/g, "")
      .trim();

    let tags = [];

    try {
      tags = JSON.parse(cleaned);
    } catch {
      // fallback: extract words manually if JSON breaks
      tags = cleaned
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map(t => t.trim());
    }

    if (!Array.isArray(tags)) return [];

    // normalize + dedupe
    const normalized = tags
      .map(t =>
        t
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ")
      )
      .filter(Boolean);

    const unique = [...new Set(normalized)];

    return unique.slice(0, 8);

  } catch (error) {
    console.error("[AI] Tag generation failed:", error.message);
    return [];
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