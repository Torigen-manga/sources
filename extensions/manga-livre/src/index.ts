import {
  AbstractSource,
  type Manga,
  type SearchRequest,
  type Section,
  type SourceCapabilities,
  type SourceInfo,
  type ChapterEntry,
  type Chapter,
  type SourceFieldsMetadata,
  type MangaEntry,
  type PagedResults,
  type Tag,
  type AppRequest,
} from "@torigen/mounter";
import {
  parseChapterDetails,
  parseChapterList,
  parseFeaturedSection,
  parseLatestUpdates,
  parseMangaDetails,
  parsePopularSection,
} from "./parser";

const capabilities: SourceCapabilities = {
  supportsHomepage: true,
  supportsSearch: false,
  supportsViewMore: false,
  supportIncludeTags: false,
  supportExcludeTags: false,
  supportPagination: false,
};

const fieldsMetadata: SourceFieldsMetadata = {
  search: {},
  viewMore: {},
};

class MangaLivreSource extends AbstractSource {
  readonly info: SourceInfo = {
    id: "mangalivre",
    name: "Manga Livre",
    iconUrl: "https://mangalivre.blog/favicon.ico",
    baseUrl: "https://mangalivre.blog",
  };

  readonly capabilities = capabilities;

  readonly fieldsMetadata: SourceFieldsMetadata = fieldsMetadata;

  async getHomepage(): Promise<Section[]> {
    const homeRequest: AppRequest = {
      url: this.info.baseUrl,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };

    const res = await this.requestManager.fetch(homeRequest);
    const html = await res.text();

    const sections: Section[] = [];

    sections.push(parsePopularSection(html));
    sections.push(parseFeaturedSection(html));
    sections.push(parseLatestUpdates(html));

    return sections;
  }

  // TODO: Implement search functionality
  // Note: Manga Livre does not support advanced search
  // and the search results are not properly paginated
  // so only basic search will be implemented.
  getSearchResults(query: SearchRequest): Promise<PagedResults<MangaEntry>> {
    throw new Error("getSearchResults not implemented.");
  }

  // Note: Manga Livre does not support view more functionality
  getViewMoreItems(
    sectionId: string,
    metadata: any
  ): Promise<PagedResults<MangaEntry>> {
    throw new Error("getViewMoreItems not implemented.");
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const mangaRequest: AppRequest = {
      url: `${this.info.baseUrl}/manga/${mangaId}`,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };

    const res = await this.requestManager.fetch(mangaRequest);
    const html = await res.text();

    return parseMangaDetails(html);
  }

  async getChapters(mangaId: string): Promise<ChapterEntry[]> {
    const mangaRequest: AppRequest = {
      url: `${this.info.baseUrl}/manga/${mangaId}`,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };

    const res = await this.requestManager.fetch(mangaRequest);
    const html = await res.text();

    return parseChapterList(html);
  }

  async getChapterDetails(chapterId: string): Promise<Chapter> {
    const chapterRequest: AppRequest = {
      url: `${this.info.baseUrl}/capitulo/${chapterId}`,
      method: "GET",
      headers: {
        Referer: this.info.baseUrl,
      },
    };

    const res = await this.requestManager.fetch(chapterRequest);
    const html = await res.text();

    return parseChapterDetails(html, chapterId);
  }

  getSearchTags(): Promise<Tag[]> {
    throw new Error("getSearchTags not implemented.");
  }
}

class CustomRequestManager {
  async fetch(req: AppRequest): Promise<Response> {
    const url = new URL(req.url);
    if (req.params) {
      Object.entries(req.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const options: RequestInit = {
      method: req.method,
      headers: req.headers,
    };

    if (
      req.data &&
      (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")
    ) {
      options.body = JSON.stringify(req.data);
      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(url.toString(), options);

    if (response.ok) {
      return response;
    } else {
      throw new Error(`Request failed with status: ${response.status}`);
    }
  }
}

export default MangaLivreSource;
