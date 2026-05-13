"use client";

import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import { subscribeMyChats, type FirestoreChatRoomRow } from "@/lib/firebase-chat";
import { useAppSelector } from "@/store/hooks";
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
  const active = Boolean(userId) && isFirebaseConfigured();
  const db = active ? getFirestoreDb() : null;

  const [rooms, setRooms] = useState<FirestoreChatRoomRow[]>([]);
  const [listLoaded, setListLoaded] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !userId) {
      const t = window.setTimeout(() => {
        setRooms([]);
        setListLoaded(false);
        setListError(null);
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
  }, [db, userId]);

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
