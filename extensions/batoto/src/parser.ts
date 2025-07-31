import { load, type CheerioAPI } from "cheerio";
import type { MangaEntry } from "@torigen/mounter";

function extractSeriesId(url: string): string {
  const match = url.match(/\/series\/([^/]+)/);
  return match ? match[1] : "";
}

function buildUrlFromId(id: string): string {
  return `https://bato.to/series/${id}`;
}

function parsePopularUpdates(html: string): MangaEntry[] {
  const $: CheerioAPI = load(html);
  const mangaEntries: MangaEntry[] = [];

  const section = $("div.home-popular");
  const items = section.find("div.col");

  items.each((_, el) => {
    const $el = $(el);

    const url = $el.find("a.item-cover").attr("href") || "";
    const image = $el.find("img").attr("src") || "";

    const title = $el.find("a.item-title").text().trim();
    const id = extractSeriesId(url);

    mangaEntries.push({
      id,
      title,
      image,
    });
  });

  return mangaEntries;
}

function parseLatestReleases(html: string): MangaEntry[] {
  const $: CheerioAPI = load(html);
  const mangaEntries: MangaEntry[] = [];

  const items = $("div.line-b");

  $("div.line-b").each((_, el) => {
    const $el = $(el);

    const url = $el.find("a").attr("href") || "";
    const image = $el.find("img").attr("src") || "";
    const title = $el.find("a.item-title").text().trim();

    const id = extractSeriesId(url);

    mangaEntries.push({
      id,
      title,
      image,
    });
  });

  return mangaEntries;
}

const res = await fetch("https://bato.to/latest?langs=en,pt,pt_br&page=3");

const data = await res.json();

const html = data.res.html;

const test = parseLatestReleases(html);

console.log(test);
