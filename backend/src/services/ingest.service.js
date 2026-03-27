import Item from "../models/item.model.js";
import { generateEmbedding, generateTags } from "./ai.service.js";
import { detectType, scrapeContent, scrapePdf } from "./scraper.service.js";

export async function extractItemSource({ url, manualType, file }) {
  if (!url && !file) {
    throw new Error("URL or file is required");
  }

  if (file) {
    if (file.mimetype.startsWith("image/")) {
      return {
        url: url || `image-upload-${Date.now()}`,
        type: "image",
        title: file.originalname || "Image",
        content: "",
        thumbnail: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      };
    }

    const pdfResult = await scrapePdf(file.buffer);

    return {
      url: url || `pdf-upload-${Date.now()}`,
      type: "pdf",
      title: pdfResult.title,
      content: pdfResult.content,
      thumbnail: pdfResult.thumbnail,
    };
  }

  const type = manualType || detectType(url);
  const result = await scrapeContent(url, type);

  return {
    url,
    type,
    title: result.title,
    content: result.content,
    thumbnail: result.thumbnail,
  };
}

export async function buildItemAiFields({ title, content }) {
  const embeddingText = `${title} ${content}`;

  const [tags, embedding] = await Promise.all([
    generateTags(title, content),
    generateEmbedding(embeddingText),
  ]);

  return {
    tags,
    embedding,
    status: "ready",
    processingError: null,
    summary: "",
    chunkCount: 0,
    embeddedAt: embedding.length ? new Date() : null,
  };
}

export async function buildProcessedItemData({ url, manualType, file }) {
  const sourceFields = await extractItemSource({ url, manualType, file });
  const aiFields = await buildItemAiFields(sourceFields);

  return {
    ...sourceFields,
    ...aiFields,
  };
}

export async function processIngestJob(itemId) {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  if (item.status === "ready" && item.embeddedAt) {
    return { skipped: true, reason: "Item already processed" };
  }

  item.status = "processing";
  item.processingError = null;
  await item.save();

  try {
    // We are keeping the worker conservative for now.
    // Uploaded files are not persisted yet, so full background reprocessing
    // would be unreliable. The next phase will move real ingestion here once
    // raw source data is stored safely for every item type.
    item.status = "ready";
    item.processingError = null;
    item.chunkCount = item.chunkCount || 0;
    item.embeddedAt = item.embedding?.length ? item.embeddedAt || new Date() : null;
    await item.save();

    return { success: true, itemId: String(item._id) };
  } catch (error) {
    item.status = "failed";
    item.processingError = error.message;
    await item.save();
    throw error;
  }
}
