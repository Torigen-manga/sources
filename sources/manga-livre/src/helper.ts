import type { Status } from "@torigen/mounter";

export const fromUrl = {
  getMangaIdFromUrl(url: string): string {
    return url.match(/\/manga\/([^/]+)/)?.[1] ?? "";
  },

  getChapterIdFromUrl(url: string): string {
    return url.match(/\/capitulo\/([^/]+)/)?.[1] ?? "";
  },
};

export function statusReturnal(status: string): Status {
  switch (status) {
    case "Em Andamento":
      return "Ongoing";
    case "Completo":
      return "Completed";
    case "Em Lançamento":
      return "Ongoing";
    case "Hiato":
      return "Hiatus";
    default:
      return "Unknown";
  }
}
