import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export function daysRemaining(dueDate: string, asOf: Date | string): number {
  const due = startOfDay(parseISO(dueDate));
  const now = startOfDay(typeof asOf === "string" ? parseISO(asOf) : asOf);
  return differenceInCalendarDays(due, now);
}

export function dueLabel(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function dueTone(days: number): "danger" | "warning" | "info" | "neutral" {
  if (days < 0) return "danger";
  if (days === 0) return "warning";
  if (days <= 2) return "warning";
  if (days <= 5) return "info";
  return "neutral";
}
