import type { Status } from "@torigen/mounter";

export function statusReturnal(status: string): Status {
  switch (status.toLowerCase()) {
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "hiatus":
      return "Hiatus";
    case "pending":
      return "Unknown";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function extractSeriesId(url: string): string {
  const match = url.match(/\/series\/([^/]+)/);
  return match ? match[1] : "";
}

export function buildUrlFromId(id: string): string {
  return `https://bato.to/series/${id}`;
}
