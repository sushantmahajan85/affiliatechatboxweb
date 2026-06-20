import { format, isToday } from "date-fns";
import { enUS } from "date-fns/locale";

const LOCALE = enUS;

/** Stable chat timestamps — same output on server and client (en-US). */
export function formatChatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return isToday(date) ? format(date, "p", { locale: LOCALE }) : format(date, "MMM d", { locale: LOCALE });
}

export function formatChatMessageTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "p", { locale: LOCALE });
}
