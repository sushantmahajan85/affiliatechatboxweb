import type { AppDispatch } from "@/store/store";
import { openWalkthrough } from "@/store/uiSlice";

const STORAGE_KEY_PREFIX = "app-walkthrough-completed:";

function storageKey(userId: string | null | undefined): string {
  return `${STORAGE_KEY_PREFIX}${userId || "guest"}`;
}

export function hasCompletedWalkthrough(userId: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey(userId)) === "1";
}

export function markWalkthroughCompleted(userId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), "1");
}

export function openWalkthroughForNewUser(
  dispatch: AppDispatch,
  userId: string | null | undefined,
  isNewUser: boolean
): void {
  if (!isNewUser || hasCompletedWalkthrough(userId)) return;
  dispatch(openWalkthrough());
}
