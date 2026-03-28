import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "./ai.service.js";

dotenv.config();

let pineconeIndex = null;

function getPineconeIndex() {
  if (pineconeIndex) return pineconeIndex;

  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !indexName) {
    throw new Error("Missing Pinecone configuration");
  }

  const client = new Pinecone({ apiKey });
  pineconeIndex = client.index(indexName);
  return pineconeIndex;
}

export async function upsertItemChunks(item, chunks) {
  if (!chunks.length) return { upsertedCount: 0 };

  const index = getPineconeIndex();

  const vectors = [];

  for (const chunk of chunks) {
    const values = await generateEmbedding(chunk.text);

    if (!values.length) continue;

    vectors.push({
      id: `${item._id}-chunk-${chunk.index}`,
      values,
      metadata: {
        itemId: String(item._id),
        userId: String(item.user),
        collectionId: item.collection ? String(item.collection) : "",
        type: item.type,
        title: item.title,
        url: item.url || "",
        tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
        summary: item.summary || "",
        chunkIndex: chunk.index,
        text: chunk.text,
      },
    });
  }

  if (!vectors.length) return { upsertedCount: 0 };

  await index.upsert(vectors);

  return { upsertedCount: vectors.length };
}

export async function searchItemChunks({
  query,
  userId,
  type,
  collectionId,
  topK = 10,
}) {
  const index = getPineconeIndex();
  const queryVector = await generateEmbedding(query);

  if (!queryVector.length) return [];

  const filter = {
    userId: { $eq: String(userId) },
  };

  if (type) filter.type = { $eq: type };
  if (collectionId) filter.collectionId = { $eq: String(collectionId) };

  const result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });

  return result.matches || [];
}
