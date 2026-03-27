import Item from "../models/item.model.js";
import { generateEmbedding, generateTags } from "./ai.service.js";
import { detectType, scrapeContent, scrapePdf } from "./scraper.service.js";
import { upsertItemChunks } from "./vector.service.js";

async function buildUploadSourceFields(file) {
  return {
    sourceKind: "upload",
    sourceUrl: "",
    sourceFileName: file.originalname || "",
    sourceMimeType: file.mimetype || "",
    sourceData: file.buffer || null,
    sourceStoragePath: "",
    sourceStatus: "available",
  };
}

export async function buildPendingItemData({ url, manualType, file }) {
  if (!url && !file) {
    throw new Error("URL or file is required");
  }

  if (file) {
    const sourceFields = await buildUploadSourceFields(file);
    const isImage = file.mimetype.startsWith("image/");

    return {
      url: url || `${isImage ? "image" : "pdf"}-upload-${Date.now()}`,
      type: isImage ? "image" : "pdf",
      title: file.originalname || (isImage ? "Image" : "PDF Document"),
      content: "",
      thumbnail: "",
      tags: [],
      embedding: [],
      status: "pending",
      processingError: null,
      summary: "",
      chunkCount: 0,
      embeddedAt: null,
      ...sourceFields,
    };
  }

  const type = manualType || detectType(url);

  return {
    url,
    type,
    title: "Processing...",
    content: "",
    thumbnail: "",
    tags: [],
    embedding: [],
    status: "pending",
    processingError: null,
    summary: "",
    chunkCount: 0,
    embeddedAt: null,
    sourceKind: "url",
    sourceUrl: url,
    sourceFileName: "",
    sourceMimeType: "",
    sourceData: null,
    sourceStoragePath: "",
    sourceStatus: "available",
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

export function buildContentChunks(text, options = {}) {
  const normalizedText = (text || "").replace(/\s+/g, " ").trim();

  if (!normalizedText) return [];

  const chunkSize = options.chunkSize || 800;
  const overlap = options.overlap || 120;
  const chunks = [];

  let start = 0;
  let index = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    const chunkText = normalizedText.slice(start, end).trim();

    if (chunkText) {
      chunks.push({
        index,
        text: chunkText,
        charStart: start,
        charEnd: end,
      });
      index += 1;
    }

    if (end >= normalizedText.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

async function extractProcessedFieldsFromItem(item) {
  if (item.sourceKind === "url") {
    if (!item.sourceUrl) {
      throw new Error("Missing source URL for URL item");
    }

    const result = await scrapeContent(item.sourceUrl, item.type);

    return {
      url: item.sourceUrl,
      type: item.type,
      title: result.title,
      content: result.content,
      thumbnail: result.thumbnail,
    };
  }

  if (item.sourceKind === "upload") {
    if (item.sourceStatus !== "available" || !item.sourceData) {
      throw new Error("Upload source data is not available");
    }

    const fileBuffer = item.sourceData;

    if (item.type === "image") {
      return {
        url: item.url,
        type: "image",
        title: item.sourceFileName || item.title || "Image",
        content: "",
        thumbnail: `data:${item.sourceMimeType};base64,${fileBuffer.toString("base64")}`,
      };
    }

    const pdfResult = await scrapePdf(fileBuffer);

    return {
      url: item.url,
      type: "pdf",
      title: pdfResult.title || item.sourceFileName || "PDF Document",
      content: pdfResult.content,
      thumbnail: pdfResult.thumbnail,
    };
  }

  throw new Error(`Unsupported source kind: ${item.sourceKind}`);
}

export async function processIngestJob(itemId) {
  const item = await Item.findById(itemId).select("+sourceData");

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
    const processedFields = await extractProcessedFieldsFromItem(item);
    const aiFields = await buildItemAiFields(processedFields);
    const chunks = buildContentChunks(processedFields.content);

    Object.assign(item, processedFields, aiFields, {
      chunks,
      chunkCount: chunks.length,
    });
    await item.save();
    await upsertItemChunks(item, chunks);

    return { success: true, itemId: String(item._id) };
  } catch (error) {
    item.status = "failed";
    item.processingError = error.message;
    await item.save();
    throw error;
  }
}
