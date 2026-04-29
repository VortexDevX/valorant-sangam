import type { SeriesRecord } from "@/types/series";

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getSeriesStatusLabel(status: SeriesRecord["status"]): string {
  switch (status) {
    case "scheduled":
      return "Upcoming";
    case "veto_in_progress":
      return "Veto In Progress";
    case "veto_completed":
      return "Ready For Results";
    case "completed":
      return "Completed";
    default:
      return String(status).replaceAll("_", " ");
  }
}
