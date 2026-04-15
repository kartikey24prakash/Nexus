import axios from "axios";
import * as cheerio from "cheerio";
import ytdl from "ytdl-core";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const detectType = (url) => {
  if (/twitter\.com|x\.com/.test(url)) return "tweet";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return "image";
  if (/\.(pdf)(\?.*)?$/i.test(url)) return "pdf";
  return "article";
};

const scrapeArticle = async (url) => {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });

  const $ = cheerio.load(data);
  $("script, style, nav, footer, header, aside, iframe").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text() ||
    "Untitled";

  const thumbnail = $("meta[property='og:image']").attr("content") || "";

  const contentSelectors = ["article", "main", ".post-content", ".entry-content", "body"];
  let content = "";

  for (const selector of contentSelectors) {
    const text = $(selector).text().trim();
    if (text.length > 200) {
      content = text;
      break;
    }
  }

  content = content.replace(/\s+/g, " ").trim().slice(0, 5000);

  return { title, content, thumbnail };
};

const scrapeTweet = async (url) => {
  const match = url.match(/status\/(\d+)/);
  if (!match) throw new Error("Invalid tweet URL");

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

const fetchYoutubeTranscript = async (info) => {
  try {
    const captionTracks =
      info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

    if (!captionTracks.length) return "";

    const preferredTrack =
      captionTracks.find((track) => track.languageCode === "en" && !track.kind) ||
      captionTracks.find((track) => track.languageCode === "en") ||
      captionTracks.find((track) => !track.kind) ||
      captionTracks[0];

    if (!preferredTrack?.baseUrl) return "";

    const { data } = await axios.get(preferredTrack.baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    const $ = cheerio.load(data, { xmlMode: true });

    return $("text")
      .map((_, element) => $(element).text().trim())
      .get()
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (error) {
    console.warn("[Scraper] YouTube transcript fetch failed:", error.message);
    return "";
  }
};

const extractYoutubeVideoId = (url) => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (parsedUrl.pathname.startsWith("/shorts/")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[1] || "";
    }

    return parsedUrl.searchParams.get("v") || "";
  } catch {
    return "";
  }
};

const getYoutubeOEmbed = async (url) => {
  const { data } = await axios.get(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    }
  );

  return data;
};

const scrapeYoutubeFallback = async (url) => {
  const videoId = extractYoutubeVideoId(url);
  let pageTitle = "";
  let pageDescription = "";
  let pageThumbnail = "";
  let oembedTitle = "";
  let oembedAuthor = "";
  let oembedThumbnail = "";

  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    const $ = cheerio.load(data);

    pageTitle =
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='title']").attr("content") ||
      $("title").text() ||
      "";

    pageDescription =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";

    pageThumbnail =
      $("meta[property='og:image']").attr("content") ||
      $("link[itemprop='thumbnailUrl']").attr("href") ||
      "";
  } catch (error) {
    console.warn("[Scraper] YouTube page fallback failed:", error.message);
  }

  try {
    const oembed = await getYoutubeOEmbed(url);
    oembedTitle = oembed.title || "";
    oembedAuthor = oembed.author_name || "";
    oembedThumbnail = oembed.thumbnail_url || "";
  } catch (error) {
    console.warn("[Scraper] YouTube oEmbed fallback failed:", error.message);
  }

  const cleanedPageTitle = pageTitle.replace(/\s*-\s*YouTube\s*$/i, "").trim();
  const title = oembedTitle || cleanedPageTitle || "YouTube Video";
  const thumbnail =
    pageThumbnail ||
    oembedThumbnail ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

  const contentParts = [
    pageDescription,
    oembedAuthor ? `Channel: ${oembedAuthor}` : "",
    videoId ? `Video ID: ${videoId}` : "",
  ].filter(Boolean);

  return {
    title,
    content: contentParts.join("\n").slice(0, 15000),
    thumbnail,
  };
};

const scrapeYoutube = async (url) => {
  try {
    const info = await ytdl.getBasicInfo(url);
    const details = info.videoDetails;
    const transcript = await fetchYoutubeTranscript(info);

    const title = details.title || "YouTube Video";
    const description = details.description || "";
    const content = [description, transcript].filter(Boolean).join("\n\n").slice(0, 15000);
    const thumbnail = details.thumbnails?.[details.thumbnails.length - 1]?.url || "";

    return { title, content, thumbnail };
  } catch (error) {
    console.warn("[Scraper] YouTube basic info failed, using fallback:", error.message);
    return scrapeYoutubeFallback(url);
  }
};

const scrapeImage = async (url) => {
  const title = url.split("/").pop().split("?")[0] || "Image";
  const content = "";
  const thumbnail = url;

  return { title, content, thumbnail };
};

export const scrapePdf = async (fileBuffer) => {
  const uint8Array = new Uint8Array(fileBuffer);
  const loadingTask = getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + " ";
  }

  return {
    title: "PDF Document",
    content: text.replace(/\s+/g, " ").trim().slice(0, 5000),
    thumbnail: "",
  };
};

export const scrapeContent = async (url, type) => {
  switch (type) {
    case "article":
      return scrapeArticle(url);
    case "tweet":
      return scrapeTweet(url);
    case "youtube":
      return scrapeYoutube(url);
    case "image":
      return scrapeImage(url);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};
