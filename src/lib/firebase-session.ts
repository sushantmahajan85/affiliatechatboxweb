"use client";

import { getAuth, signInWithCustomToken, signOut, type Auth } from "firebase/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { getFirebaseApp } from "@/lib/firebase-app";

/**
 * Firestore/Storage rules only trust request.auth, so before the web touches chat data it signs in
 * to Firebase with a custom token minted by the backend for the logged-in user (uid = user id).
 */

type Credentials = { userId: string; apiToken: string };

let desired: Credentials | null = null;
let inflight: Promise<boolean> | null = null;

function firebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

/** Called by the provider whenever the logged-in user (or their API token) changes. */
export function setChatSessionCredentials(userId: string | null, apiToken: string | null): void {
  desired = userId && apiToken ? { userId, apiToken } : null;
}

export function isChatSessionFor(userId: string | null | undefined): boolean {
  const auth = firebaseAuth();
  return Boolean(userId && auth?.currentUser?.uid === userId);
}

/**
 * Make sure Firebase Auth is signed in as the current user. Resolves true when it is.
 * Safe to call often: returns immediately when already signed in, and shares one request.
 */
export async function ensureFirebaseChatSession(): Promise<boolean> {
  const auth = firebaseAuth();
  const want = desired;
  if (!auth || !want) return false;
  if (auth.currentUser?.uid === want.userId) return true;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/firebase-token`, {
      headers: { Authorization: `Bearer ${want.apiToken}` },
    });
    if (!res.ok) {
      throw new Error(
        res.status === 401 ? "Your session expired. Please sign in again." : "Chat is unavailable right now."
      );
    }
    const { token } = (await res.json()) as { token?: string };
    if (!token) throw new Error("Chat is unavailable right now.");
    // The user may have logged out or switched while the token was in flight.
    if (desired?.userId !== want.userId) return false;
    await signInWithCustomToken(auth, token);
    return auth.currentUser?.uid === want.userId;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Sign Firebase out (on app logout). */
export async function endFirebaseChatSession(): Promise<void> {
  desired = null;
  const auth = firebaseAuth();
  if (auth?.currentUser) {
    await signOut(auth).catch(() => undefined);
  }
}
