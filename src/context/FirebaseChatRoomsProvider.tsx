"use client";

import { getFirebaseApp, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import { subscribeMyChats, type FirestoreChatRoomRow } from "@/lib/firebase-chat";
import {
  endFirebaseChatSession,
  ensureFirebaseChatSession,
  isChatSessionFor,
  setChatSessionCredentials,
} from "@/lib/firebase-session";
import { useAppSelector } from "@/store/hooks";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, startTransition } from "react";

export type FirebaseChatRoomsContextValue = {
  active: boolean;
  rooms: FirestoreChatRoomRow[];
  listLoaded: boolean;
  listError: string | null;
};

const FirebaseChatRoomsContext = createContext<FirebaseChatRoomsContextValue | null>(null);

export function FirebaseChatRoomsProvider({ children }: { children: React.ReactNode }) {
  const userId = useAppSelector((s) => s.auth.userId || s.auth.user?._id || "") || "";
  const apiToken = useAppSelector((s) => s.auth.token) || "";
  const configured = isFirebaseConfigured();

  // Uid Firebase Auth is signed in as; chat is live only when it matches the app user,
  // because Firestore rules check request.auth.uid against chat members.
  const [sessionUid, setSessionUid] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    if (!userId || !apiToken) {
      setChatSessionCredentials(null, null);
      void endFirebaseChatSession();
      return;
    }
    setChatSessionCredentials(userId, apiToken);
    let cancelled = false;

    const connect = () => {
      ensureFirebaseChatSession()
        .then((ok) => {
          if (cancelled) return;
          setSessionUid(ok ? userId : null);
          setSessionError(ok ? null : "Chat is unavailable right now.");
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setSessionUid(null);
          setSessionError(e instanceof Error ? e.message : "Chat is unavailable right now.");
        });
    };
    connect();

    // Phone verification signs Firebase in/out with its own user; sign back in as the chat user
    // once it is done (signed out). Writes also re-check via ensureFirebaseChatSession().
    const app = getFirebaseApp();
    const unsubAuth = app
      ? onAuthStateChanged(getAuth(app), (fbUser) => {
          if (cancelled) return;
          setSessionUid(fbUser?.uid ?? null);
          if (!fbUser) connect();
        })
      : () => undefined;

    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, [configured, userId, apiToken]);

  const active =
    Boolean(userId) && configured && sessionUid === userId && isChatSessionFor(userId);
  const db = active ? getFirestoreDb() : null;

  const [rooms, setRooms] = useState<FirestoreChatRoomRow[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !userId) {
      const t = window.setTimeout(() => {
        setRooms([]);
        setListLoaded(Boolean(sessionError));
        setListError(sessionError);
      }, 0);
      return () => window.clearTimeout(t);
    }
    startTransition(() => {
      setListError(null);
      setListLoaded(false);
    });
    const unsub = subscribeMyChats(
      db,
      userId,
      (rows) => {
        setRooms(rows);
        setListLoaded(true);
      },
      (e) => {
        setListError(e.message);
        setListLoaded(true);
      }
    );
    return unsub;
  }, [db, userId, sessionError]);

  const value = useMemo<FirebaseChatRoomsContextValue>(
    () => ({ active, rooms, listLoaded, listError }),
    [active, rooms, listLoaded, listError]
  );

  return <FirebaseChatRoomsContext.Provider value={value}>{children}</FirebaseChatRoomsContext.Provider>;
}

export function useFirebaseChatRoomsContext(): FirebaseChatRoomsContextValue {
  const ctx = useContext(FirebaseChatRoomsContext);
  if (!ctx) {
    return { active: false, rooms: [], listLoaded: true, listError: null };
  }
  return ctx;
}

export function useChatBackendIsFirebase(): boolean {
  return useFirebaseChatRoomsContext().active;
}
