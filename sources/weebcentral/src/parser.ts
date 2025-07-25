import type {
  Chapter,
  ChapterEntry,
  MangaEntry,
  Section,
  Tag,
} from "@torigen/mounter";
import { load, type CheerioAPI } from "cheerio";
import {
  getIdFromChapterUrl,
  getIdFromSeriesUrl,
  statusReturnal,
} from "./utils";

function parseChapterList(html: string): ChapterEntry[] {
  const $: CheerioAPI = load(html);
  const chapterEntries: ChapterEntry[] = [];

  const chapterItem = $('div[x-data*="checkNewChapter"]');

  chapterItem.each((_, el) => {
    const $el = $(el);

    const url: string | undefined = $el.find("a").attr("href");
    const id: string = url ? getIdFromChapterUrl(url) : "";
    const title: string = $el
      .find("a > span:nth-of-type(2) > span")
      .first()
      .text()
      .trim();

    const timestamp: string = $el.find("time").text().trim();

    chapterEntries.push({
      id,
      title,
      timestamp,
    });
  });

  return chapterEntries;
}

function parseMangaDetails(html: string) {
  const $: CheerioAPI = load(html);
  const image: string = $("picture > source").attr("srcset") || "";
  const title: string = $("h1.text-2xl").first().text().trim();
  const description: string = $("ul > li > strong")
    .filter((_, el) => $(el).text().trim() === "Description")
    .next("p")
    .text()
    .trim();

  const authors: string[] = [];
  const tags: Tag[] = [];

  $('li:contains("Author(s):") a').each((_, el) => {
    authors.push($(el).text().trim());
  });

  $('li:contains("Tags(s):") a').each((_, el) => {
    tags.push({
      id: $(el).text().trim(),
      label: $(el).text().trim(),
    });
  });

  const status: string = $('li:contains("Status:") a').text().trim();

  return {
    image,
    title,
    description,
    authors,
    artists: [],
    tags,
    status: statusReturnal(status),
  };
}

function parseHotUpdates(html: string): Section {
  const $ = load(html);

  const hotSection = $("h2 > span > span")
    .filter((_, el) => $(el).text().trim() === "Hot Updates")
    .closest("section");

  const articles = hotSection.find("article");

  const entries: MangaEntry[] = [];

  for (let i = 0; i < articles.length; i += 2) {
    const chapterArticle = $(articles[i]);
    const seriesArticle = $(articles[i + 1]);

    const title = chapterArticle
      .find("a > div:nth-of-type(2) > div")
      .first()
      .text()
      .trim();
    const image = chapterArticle.find("a > div > picture > img").attr("src");
    const url = seriesArticle.find("a").attr("href");

    if (!url || !image || !title) continue;

    const id = getIdFromSeriesUrl(url);

    entries.push({
      id,
      title,
      image,
    });
  }

  return {
    id: "hot-updates",
    title: "Hot Updates",
    items: entries,
    type: "SingleRowLarge",
    containsMoreItems: false,
  };
}

function parseLatestUpdates(html: string): Section {
  const $ = load(html);

  const article = $("article");

  const entries: MangaEntry[] = [];

  article.each((_, article) => {
    const $article = $(article);

    const url = $article.find("a").attr("href");
    const image = $article.find("a").find("picture > img").attr("src");
    const title = $($article.find("a")[1]).find(".font-semibold").text().trim();

    if (!url || !image || !title) {
      if (!url) {
        console.warn("Missing URL in Latest Updates article");
      }
      if (!image) {
        console.warn("Missing image in Latest Updates article");
      }
      if (!title) {
        console.warn("Missing title in Latest Updates article:");
      }
      return;
    }

    const id = getIdFromSeriesUrl(url);

    entries.push({
      id,
      title,
      image,
    });
  });

  return {
    id: "latest-updates",
    title: "Latest Updates",
    items: entries,
    type: "SingleRowNormal",
    containsMoreItems: true,
  };
}

function parseChapterPages(html: string): string[] {
  const $ = load(html);
  const pages: string[] = [];

  const image = $("img");

  image.each((_, el) => {
    const src = $(el).attr("src");

    if (src) {
      pages.push(src);
    }
  });

  return pages;
}

function parseChapterDetails(html: string): Pick<Chapter, "title" | "number"> {
  const $: CheerioAPI = load(html);

  const title = $("section#nav-top > div > div")
    .first()
    .find("button")
    .first()
    .find("span")
    .text()
    .trim();

  if (!title) {
    console.warn("⚠️ Could not find chapter title in DOM.");
  }

  const numberMatch = title.match(/(\d+(\.\d+)?)/);
  const number: number = numberMatch ? Number(numberMatch[0]) : 0;

  return {
    title,
    number,
  };
}

function parseSearchResults(html: string): MangaEntry[] {
  const $: CheerioAPI = load(html);
  const entries: MangaEntry[] = [];

  $("article").each((_, article) => {
    const $article = $(article);

    const title = $article.find("a.line-clamp-1.link-hover").text().trim();
    const id = $article.find("a").attr("href")?.split("/")[4] || "";
    const image =
      $article.find("picture source:first-of-type").attr("srcset") || "";

    if (title && image && id) {
      entries.push({ title, image, id });
    }
  });

  return entries;
}

function parseTags(html: string): Tag[] {
  const $: CheerioAPI = load(html);

  const tags: Tag[] = [];

  const tagSection = $("div.collapse-title")
    .filter((_, el) => $(el).text().trim() === "Tags")
    .next(".collapse-content");

  tagSection.find("label > span").each((_, el) => {
    const tagText = $(el).text().trim();

    if (tagText) {
      tags.push({
        id: tagText,
        label: tagText,
      });
    }
  });

  return tags;
}

export {
  parseChapterList,
  parseMangaDetails,
  parseHotUpdates,
  parseLatestUpdates,
  parseChapterPages,
  parseChapterDetails,
  parseSearchResults,
  parseTags,
};
