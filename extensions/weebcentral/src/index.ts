import {
  type Chapter,
  type ChapterEntry,
  type Manga,
  type PagedResults,
  type SearchRequest,
  type Section,
  type SourceCapabilities,
  type MetadataProvider,
  type SourceInfo,
  type Tag,
  type AppRequest,
  type MangaEntry,
  AbstractSource,
} from "@torigen/mounter";

import {
  parseChapterDetails,
  parseChapterList,
  parseChapterPages,
  parseHotUpdates,
  parseLatestUpdates,
  parseMangaDetails,
  parseSearchResults,
  parseTags,
} from "./parser";

class WeebCentralSource extends AbstractSource {
  readonly info: SourceInfo = {
    id: "weebcentral",
    name: "WeebCentral",
    iconUrl: "https://weebcentral.com/favicon.ico",
    baseUrl: "https://weebcentral.com",
    locale: "en-US",
  };

  readonly capabilities: SourceCapabilities = {
    supportsHomepage: true,
    supportsSearch: true,
    supportsViewMore: true,
    supportIncludeTags: true,
    supportExcludeTags: true,
    supportPagination: true,
  };

  readonly metadata: MetadataProvider = {
    search: {
      sort: {
        title: "Sort",
        type: "select",
        options: [
          "Best Match",
          "Alphabet",
          "Popularity",
          "Subscribers",
          "Recently Added",
          "Latest Updates",
        ],
      },
      order: {
        title: "Order",
        type: "select",
        options: ["Ascending", "Descending"],
      },
      official: {
        title: "Official Translation",
        type: "select",
        options: ["Any", "True", "False"],
      },
      anime: {
        title: "Anime Adaptation",
        type: "select",
        options: ["Any", "True", "False"],
      },
      adult: {
        title: "Adult Content",
        type: "select",
        options: ["Any", "True", "False"],
      },
      included_status: {
        title: "Series Status",
        type: "select",
        options: ["Canceled", "Ongoing", "Complete", "Hiatus"],
      },
      included_type: {
        title: "Series Type",
        type: "select",
        options: ["Manga", "Manhwa", "Manhua", "OEL"],
      },
    },
  };

  async getHomepage(): Promise<Section[]> {
    const homeRequest: AppRequest = {
      url: this.info.baseUrl,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };
    const updatesRequest: AppRequest = {
      url: `${this.info.baseUrl}/latest-updates/1`,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };

    const [homeResponse, updatesResponse] = await Promise.all([
      this.requestManager.fetch(homeRequest),
      this.requestManager.fetch(updatesRequest),
    ]);

    const html: string = await homeResponse.text();
    const htmlUpdates: string = await updatesResponse.text();

    const hotUpdates = parseHotUpdates(html);
    const latestUpdates = parseLatestUpdates(htmlUpdates);

    const sections: Section[] = [hotUpdates, latestUpdates];

    return sections;
  }

  async getMangaDetails(id: string): Promise<Manga> {
    const request: AppRequest = {
      url: `${this.info.baseUrl}/series/${id}`,
      method: "GET",
    };

    const res = await this.requestManager.fetch(request);
    const html = await res.text();

    return parseMangaDetails(html);
  }

  async getChapters(mangaId: string): Promise<ChapterEntry[]> {
    const request: AppRequest = {
      url: `${this.info.baseUrl}/series/${mangaId}/full-chapter-list`,
      method: "GET",
    };

    const res = await this.requestManager.fetch(request);

    const html = await res.text();
    return parseChapterList(html);
  }

  async getChapterDetails(
    _mangaId: string,
    chapterId: string
  ): Promise<Chapter> {
    const detailsRequest: AppRequest = {
      url: `${this.info.baseUrl}/chapters/${chapterId}`,
      method: "GET",
    };

    const pagesRequest: AppRequest = {
      url: `${this.info.baseUrl}/chapters/${chapterId}/images`,
      method: "GET",
      params: {
        is_prev: "False",
        current_page: 1,
        reading_style: "long_strip",
      },
    };

    const [detailsResponse, pagesResponse] = await Promise.all([
      this.requestManager.fetch(detailsRequest),
      this.requestManager.fetch(pagesRequest),
    ]);

    const html = await detailsResponse.text();
    const pagesHtml = await pagesResponse.text();

    const pages: string[] = parseChapterPages(pagesHtml);
    const { title, number } = parseChapterDetails(html);

    return {
      id: chapterId,
      title,
      number,
      pages,
      locale: "en-US",
    };
  }

  async getViewMoreItems(
    sectionId: string,
    page: number
  ): Promise<PagedResults<MangaEntry>> {
    switch (sectionId) {
      case "hot-updates": {
        throw new Error();
      }
      case "latest-updates": {
        const request: AppRequest = {
          url: `${this.info.baseUrl}/latest-updates/${page}`,
          method: "GET",
        };

        const res = await this.requestManager.fetch(request);
        const html = await res.text();

        const section = parseLatestUpdates(html);
        return {
          results: section.items,
          totalCount: section.items.length,
          hasNextPage: true,
          hasPreviousPage: false,
          limit: 32,
        };
      }
      default: {
        throw new Error(`Unknown section ID: ${sectionId}`);
      }
    }
  }

  private flattenSearchRequest(
    query: SearchRequest
  ): Record<string, string | string[]> {
    const flat: Record<string, string | string[]> = {
      text: query.title || "",
      sort: String(query.parameters?.sort ?? "Best Match"),
      order: String(query.parameters?.order ?? "Descending"),
      official: String(query.parameters?.official ?? "Any"),
      anime: String(query.parameters?.anime ?? "Any"),
      adult: String(query.parameters?.adult ?? "Any"),
      display_mode: String(query.parameters?.display_mode ?? "Full Display"),
    };

    for (const [key, val] of Object.entries(query.parameters ?? {})) {
      if (!(key in flat)) {
        flat[key] = String(val);
      }
    }

    if (query.includedTags?.length) {
      flat["included_tag"] = query.includedTags.map((t) => t.id);
    }

    if (query.excludedTags?.length) {
      flat["excluded_tag"] = query.excludedTags.map((t) => t.id);
    }

    return flat;
  }

  async getSearchResults(
    query: SearchRequest
  ): Promise<PagedResults<MangaEntry>> {
    const flatParams = this.flattenSearchRequest(query);

    const url = new URL(`${this.info.baseUrl}/search/data`);
    for (const [key, value] of Object.entries(flatParams)) {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }

    const request: AppRequest = {
      url: String(url),
      method: "GET",
    };

    const result = await this.requestManager.fetch(request);
    const html = await result.text();

    if (!html) {
      throw new Error("Failed to fetch search results.");
    }

    const res = parseSearchResults(html);

    return {
      results: res,
      totalCount: res.length,
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 32,
      offset: query.offset || 0,
    };
  }

  async getSearchTags(): Promise<Tag[]> {
    const request: AppRequest = {
      url: `${this.info.baseUrl}/search`,
      method: "GET",
    };
    const response = await this.requestManager.fetch(request);
    const html = await response.text();
    const tags = parseTags(html);
    return tags;
  }
}

export default WeebCentralSource;
