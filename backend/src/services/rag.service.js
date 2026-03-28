import Item from "../models/item.model.js";
import {
  cosineSimilarity,
  generateEmbedding,
  generateGeneralAnswer,
  generateGroundedAnswer,
} from "./ai.service.js";
import { searchItemChunks } from "./vector.service.js";

const MIN_RAG_SCORE = 0.72;
const MIN_ITEM_FALLBACK_SCORE = 0.45;
const MAX_CONTEXT_BLOCKS = 4;
const MAX_MATCHES_TO_CONSIDER = 12;

function normalizeScore(score) {
  return Math.round((score || 0) * 100) / 100;
}

function buildContextBlocks(matches) {
  const byChunk = new Map();

  for (const match of matches) {
    const itemId = match.metadata?.itemId || "";
    const chunkIndex = match.metadata?.chunkIndex ?? -1;
    const key = `${itemId}:${chunkIndex}`;

    if (!byChunk.has(key) || (match.score || 0) > (byChunk.get(key).score || 0)) {
      byChunk.set(key, {
        itemId,
        title: match.metadata?.title || "Untitled",
        type: match.metadata?.type || "",
        url: match.metadata?.url || "",
        tags: match.metadata?.tags || "",
        summary: match.metadata?.summary || "",
        chunkIndex,
        text: match.metadata?.text || "",
        score: normalizeScore(match.score),
      });
    }
  }

  return [...byChunk.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_BLOCKS);
}

async function findItemLevelFallback({ question, userId, type, collectionId }) {
  const queryEmbedding = await generateEmbedding(question);

  if (!queryEmbedding.length) return [];

  const filter = {
    user: userId,
    status: "ready",
    embedding: { $exists: true, $ne: [] },
  };

  if (type) filter.type = type;
  if (collectionId) filter.collection = collectionId;

  const items = await Item.find(filter)
    .select("title type url tags summary content embedding")
    .limit(40);

  return items
    .map((item) => ({
      itemId: String(item._id),
      title: item.title || "Untitled",
      type: item.type || "",
      url: item.url || "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      summary: item.summary || "",
      chunkIndex: -1,
      text: (item.content || "").slice(0, 1600),
      score: normalizeScore(cosineSimilarity(queryEmbedding, item.embedding)),
    }))
    .filter((item) => item.score >= MIN_ITEM_FALLBACK_SCORE && item.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_BLOCKS);
}

export async function answerQuestionWithRag({ question, userId, type, collectionId }) {
  const matches = await searchItemChunks({
    query: question,
    userId,
    type,
    collectionId,
    topK: MAX_MATCHES_TO_CONSIDER,
  });

  const strongMatches = matches
    .filter(match => (match.score || 0) >= MIN_RAG_SCORE)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const contextBlocks = strongMatches.length
    ? buildContextBlocks(strongMatches)
    : await findItemLevelFallback({ question, userId, type, collectionId });

  if (!contextBlocks.length) {
    const answer = await generateGeneralAnswer(question);

    return {
      answer,
      sources: [],
      mode: "general",
    };
  }

  const answer = await generateGroundedAnswer({
    question,
    contextBlocks,
  });

  return {
    answer,
    sources: contextBlocks,
    mode: "rag",
  };
}
