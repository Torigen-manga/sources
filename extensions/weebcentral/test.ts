import type { AppRequest, RequestManager } from "@torigen/mounter";
import WeebCentralSource from "./src";

export class TestRequestManager implements RequestManager {
  async fetch(req: AppRequest): Promise<Response> {
    const url = new URL(req.url);

    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const options: RequestInit = {
      method: req.method,
      headers: req.headers,
    };

    if (req.method !== "GET" && req.data) {
      options.body =
        typeof req.data === "string" ? req.data : JSON.stringify(req.data);

      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
    }

    return fetch(url.toString(), options);
  }
}

const weebCentralSource = new WeebCentralSource(new TestRequestManager());

(async () => {
  const res = await weebCentralSource.getSearchResults({
    title: "",
    includedTags: [
      { id: "Action", label: "Action" },
      { id: "Adult", label: "Adult" },
    ],
    excludedTags: [
      { id: "Adventure", label: "Adventure" },
      { id: "Comedy", label: "Comedy" },
    ],
    parameters: { sort: "Latest Updates" },
  });

  if (res.results.length === 0 || !res.results) {
    console.log("No results found.");
    return;
  }

  console.log(res.results);

  const chapters = await weebCentralSource.getChapters(
    res.results?.[0]?.id ?? ""
  );

  const chapterOrderByNumber = chapters.sort((a, b) => {
    return a.number - b.number;
  });

  if (chapterOrderByNumber.length === 0) {
    console.log("No chapters found for the first result.");
    return;
  }

  console.log("Chapters for the first result:", chapterOrderByNumber);
})();
