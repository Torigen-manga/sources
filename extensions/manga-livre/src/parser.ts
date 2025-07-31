import { load, type CheerioAPI } from "cheerio";
import { fromUrl, statusReturnal } from "./helper.ts";
import type {
  MangaEntry,
  Section,
  Manga,
  Tag,
  Status,
  ChapterEntry,
  Chapter,
} from "@torigen/mounter";

export function parsePopularSection(html: string): Section {
  const $: CheerioAPI = load(html);
  const entries: MangaEntry[] = [];

  const mangaEntry = $(".manga-carousel-item");

  mangaEntry.each((_, element) => {
    const $el = $(element);

    const title = $el.find("h3.manga-title > a").text().trim();
    const image = $el.find("img").attr("src") || "";
    const id = fromUrl.getMangaIdFromUrl(
      $el.find("h3.manga-title > a").attr("href") || ""
    );

    entries.push({ id, title, image });
  });

  return {
    id: "popular-section",
    title: "Mangás Populares",
    items: entries,
    type: "SingleRowNormal",
    containsMoreItems: false,
  };
}

export function parseFeaturedSection(html: string): Section {
  const $: CheerioAPI = load(html);

  const entries: MangaEntry[] = [];
  const section = $("section.featured-section");
  const entry = section.find("div > article.manga-card");

  entry.each((_, element) => {
    const $el = $(element);

    const title = $el.find("h3").text().trim();
    const image = $el.find("img").attr("src") || "";
    const id = fromUrl.getMangaIdFromUrl($el.find("a").attr("href") || "");

    entries.push({ id, title, image });
  });

  return {
    id: "featured-section",
    title: "Mangás em Destaque",
    items: entries,
    type: "SingleRowNormal",
    containsMoreItems: false,
  };
}

export function parseLatestUpdates(html: string): Section {
  const $: CheerioAPI = load(html);

  const entries: MangaEntry[] = [];
  const section = $("section.latest-section");
  const entry = section.find("div > article.manga-card");

  entry.each((_, element) => {
    const $el = $(element);

    const title = $el.find("h3").text().trim();
    const image = $el.find("img").attr("src") || "";
    const id = fromUrl.getMangaIdFromUrl($el.find("a").attr("href") || "");

    entries.push({ id, title, image });
  });

  return {
    id: "latest-updates-section",
    title: "Últimas Atualizações",
    items: entries,
    type: "SingleRowNormal",
    containsMoreItems: false,
  };
}

export function parseMangaDetails(html: string): Manga {
  const $: CheerioAPI = load(html);

  const image = $("img.manga-cover-image").attr("src") || "";
  const title = $("h1.manga-title").text().trim();
  const description = $("div.synopsis-content > p").text().trim();
  const tags: Tag[] = [];
  const authors: string[] = [];
  const artists: string[] = [];
  let status: Status = "Unknown";

  $(".manga-tag").each((_, element) => {
    const $el = $(element);
    const tag = $el.text().trim();
    tags.push({ label: tag, id: tag.toLowerCase().replace(/\s+/g, "-") });
  });

  $(".manga-meta-item").each((_, element) => {
    const $el = $(element);

    const label = $el.find(".meta-label").text().trim();
    const value = $el.find(".meta-value").text().trim();

    const splitValues = value.split(",").map((v) => v.trim());

    if (label === "Autor:") {
      authors.push(...splitValues);
    }

    if (label === "Artista:") {
      artists.push(...splitValues);
    }

    if (label === "Status:") {
      status = statusReturnal(value);
    }
  });

  return {
    image,
    title,
    description,
    authors,
    artists,
    tags,
    status,
  };
}

export function parseChapterList(html: string): ChapterEntry[] {
  const $: CheerioAPI = load(html);

  const chapters: ChapterEntry[] = [];

  $("li.chapter-item").each((_, element) => {
    const $el = $(element);

    const id = fromUrl.getChapterIdFromUrl(
      $el.find("a.chapter-link").attr("href") || ""
    );
    const title = $el.find("span.chapter-number").text().trim();

    chapters.push({ id, title });
  });

  return chapters;
}

export function parseChapterDetails(html: string, chapterId: string): Chapter {
  const $: CheerioAPI = load(html);

  const pages: string[] = [];

  const id = chapterId;
  const raw = $("h1.manga-title")
    .clone()
    .children("a, div")
    .remove()
    .end()
    .text()
    .trim();

  const title = raw
    .replace(/^\s*\/\s*/, "")
    .replace(/\s*-\s*/, " - ")
    .replace(/\s+/g, " ");

  $("img.chapter-image").each((_, element) => {
    const $el = $(element);

    const pageUrl = $el.attr("src");

    if (!pageUrl) return;

    pages.push(pageUrl);
  });

  return {
    id,
    title,
    pages,
    number: parseFloat(title.match(/(\d+(\.\d+)?)/)?.[0] || "0"),
    language: "pt-BR",
  };
}
