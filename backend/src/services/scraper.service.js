import axios from "axios";
import * as cheerio from "cheerio";
import ytdl from "ytdl-core";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ─── Detect content type from URL ─────────────────────────────────────────────
export const detectType = (url) => {
  if (/twitter\.com|x\.com/.test(url)) return "tweet";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return "image";
  if (/\.(pdf)(\?.*)?$/i.test(url)) return "pdf";
  return "article";
};

// ─── Article scraper ──────────────────────────────────────────────────────────
const scrapeArticle = async (url) => {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });

  const $ = cheerio.load(data);

  // remove noise
  $("script, style, nav, footer, header, aside, iframe").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text() ||
    "Untitled";

  const thumbnail =
    $("meta[property='og:image']").attr("content") || "";

  // grab main content — try common content selectors first
  const contentSelectors = ["article", "main", ".post-content", ".entry-content", "body"];
  let content = "";
  for (const selector of contentSelectors) {
    const text = $(selector).text().trim();
    if (text.length > 200) {
      content = text;
      break;
    }
  }

  // clean up whitespace
  content = content.replace(/\s+/g, " ").trim().slice(0, 5000);

  return { title, content, thumbnail };
};

// ─── Tweet scraper ────────────────────────────────────────────────────────────
const scrapeTweet = async (url) => {
  // extract tweet ID from URL
  const match = url.match(/status\/(\d+)/);
  if (!match) throw new Error("Invalid tweet URL");

  const tweetId = match[1];

  // Twitter oembed — no API key needed
  const { data } = await axios.get(
    `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`,
    { timeout: 10000 }
  );

  const $ = cheerio.load(data.html);
  const content = $("p").first().text() || data.html;
  const title = `Tweet by ${data.author_name}`;
  const thumbnail = "";

  return { title, content, thumbnail };
};

// ─── YouTube scraper ──────────────────────────────────────────────────────────
const scrapeYoutube = async (url) => {
  const info = await ytdl.getBasicInfo(url);
  const details = info.videoDetails;

  const title = details.title || "YouTube Video";
  const content = details.description || "";
  const thumbnail = details.thumbnails?.[details.thumbnails.length - 1]?.url || "";

  return { title, content, thumbnail };
};

// ─── Image scraper ────────────────────────────────────────────────────────────
const scrapeImage = async (url) => {
  // for images we just store the URL itself
  const title = url.split("/").pop().split("?")[0] || "Image";
  const content = "";
  const thumbnail = url;

  return { title, content, thumbnail };
};

// ─── PDF scraper ──────────────────────────────────────────────────────────────
export const scrapePdf = async (fileBuffer) => {
  const data = await pdfParse(fileBuffer);

  const title = "PDF Document";
  const content = data.text.replace(/\s+/g, " ").trim().slice(0, 5000);
  const thumbnail = "";

  return { title, content, thumbnail };
};

// ─── Main scraper function ────────────────────────────────────────────────────
export const scrapeContent = async (url, type) => {
  switch (type) {
    case "article":
      return await scrapeArticle(url);
    case "tweet":
      return await scrapeTweet(url);
    case "youtube":
      return await scrapeYoutube(url);
    case "image":
      return await scrapeImage(url);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};