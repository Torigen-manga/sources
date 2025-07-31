import { load, type CheerioAPI } from "cheerio";
import type { Manga, MangaEntry, Status } from "@torigen/mounter";
import { extractSeriesId, statusReturnal } from "./helper";

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

function parseMangaDetails(html: string) {
  const $: CheerioAPI = load(html);

  const title = $("h3.item-title > a").text().trim();
  const description = $("div.limit-html").text().trim();
  const image = $("div.attr-cover > img").attr("src") || "";

  const authors: string[] = [];
  const artists: string[] = [];
  const baseTags: string[] = [];

  let status: Status = "Unknown";

  $(".attr-item").each((_, el) => {
    const $el = $(el);
    const label = $el.find("b.text-muted").text().trim();
    const content = $el.find("span").first();

    switch (label) {
      case "Authors:":
        content.find("a").each((_, link) => {
          authors.push($(link).text().trim());
        });
        break;

      case "Artists:":
        content.find("a").each((_, link) => {
          artists.push($(link).text().trim());
        });
        break;
      case "Genres:":
        content.find("span, u").each((_, tag) => {
          const tagText = $(tag).text().trim();
          if (tagText && tagText !== ",") {
            baseTags.push(tagText);
          }
        });
        break;
      case "Upload Status:":
        status = statusReturnal(content.text().trim());
        break;
      default:
        break;
    }
  });

  return {
    title,
    description,
    image,
    authors,
    artists,
    status,
  };
}
