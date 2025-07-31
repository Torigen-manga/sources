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
