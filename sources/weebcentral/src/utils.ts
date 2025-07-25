import type { Status } from "@torigen/mounter";

function getIdFromSeriesUrl(url: string): string {
  return url.match(/\/series\/([^/]+)/)?.[1] ?? "";
}

function getIdFromChapterUrl(url: string): string {
  return url.match(/\/chapters\/([^/]+)/)?.[1] ?? "";
}

function statusReturnal(entry: string): Status {
  switch (entry) {
    case "Complete":
      return "Completed";
    case "Ongoing":
      return "Ongoing";
    case "Hiatus":
      return "Hiatus";
    case "Canceled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}
export { getIdFromSeriesUrl, statusReturnal, getIdFromChapterUrl };
