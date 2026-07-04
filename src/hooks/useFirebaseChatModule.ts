"use client";

import { useFirebaseChatRoomsContext } from "@/context/FirebaseChatRoomsProvider";
import { getFirestoreDb } from "@/lib/firebase-app";
import type { FirestoreChatRoomRow } from "@/lib/firebase-chat";
import {
  acceptFirestoreChatRequest,
  buildChatRoomId,
  isAdminSupportChatPartner,
  onChatOpenSideEffects,
  sendFirestoreChatMessage,
  subscribeChatMessages,
  subscribeChatRoomDoc,
  type FirestoreMessageRow,
} from "@/lib/firebase-chat";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";

export interface FirebaseChatModuleState {
  active: boolean;
  rooms: FirestoreChatRoomRow[];
  messages: FirestoreMessageRow[];
  roomMeta: Record<string, unknown> | null;
  activeChatRoomId: string | null;
  isSenderPending: boolean;
  isRecipientPending: boolean;
  listError: string | null;
  listLoaded: boolean;
  sendFirestoreText: (receiverId: string, text: string) => Promise<string>;
  acceptFirestoreInvite: (chatRoomId: string) => Promise<void>;
}

export function useFirebaseChatModule(
  currentUserId: string | undefined,
  selectedPartnerId: string | number | null
): FirebaseChatModuleState {
  const token = useAppSelector((s) => s.auth.token);
  const listCtx = useFirebaseChatRoomsContext();
  const active = listCtx.active && Boolean(currentUserId);
  const db = active ? getFirestoreDb() : null;

  const rooms = active ? listCtx.rooms : [];
  const listLoaded = active ? listCtx.listLoaded : false;
  const listError = active ? listCtx.listError : null;

  const [messages, setMessages] = useState<FirestoreMessageRow[]>([]);
  const [roomMeta, setRoomMeta] = useState<Record<string, unknown> | null>(null);

  const partnerStr = selectedPartnerId != null ? String(selectedPartnerId) : "";

  const activeChatRoomId = useMemo(() => {
    if (!currentUserId || !partnerStr) return null;
    return buildChatRoomId(currentUserId, partnerStr);
  }, [currentUserId, partnerStr]);

  useEffect(() => {
    if (!db || !activeChatRoomId || !currentUserId) {
      const t = window.setTimeout(() => {
        setMessages([]);
        setRoomMeta(null);
      }, 0);
      return () => window.clearTimeout(t);
    }
    const unsubMsg = subscribeChatMessages(
      db,
      activeChatRoomId,
      currentUserId,
      setMessages,
      () => undefined
    );
    const unsubRoom = subscribeChatRoomDoc(db, activeChatRoomId, setRoomMeta, () => undefined);
    void onChatOpenSideEffects(db, activeChatRoomId, currentUserId);
    return () => {
      unsubMsg();
      unsubRoom();
    };
  }, [db, activeChatRoomId, currentUserId]);

  const isRequested = String(roomMeta?.isRequested ?? "");
  const senderId = String(roomMeta?.senderId ?? "");
  const receiverId = String(roomMeta?.receiverId ?? "");

  const isAdminPartnerChat = isAdminSupportChatPartner(partnerStr);

  const isRecipientPending = useMemo(() => {
    if (!currentUserId || isAdminPartnerChat) return false;
    return isRequested === "pending" && currentUserId === receiverId;
  }, [currentUserId, isAdminPartnerChat, isRequested, receiverId]);

  const isSenderPending = useMemo(() => {
    if (!currentUserId || isAdminPartnerChat) return false;
    return isRequested === "pending" && currentUserId === senderId && messages.length >= 1;
  }, [currentUserId, isAdminPartnerChat, isRequested, senderId, messages.length]);

  const sendFirestoreText = useMemo(() => {
    return async (receiverId: string, text: string) => {
      if (!db || !currentUserId) throw new Error("Chat not ready");
      return sendFirestoreChatMessage(db, {
        currentUserId,
        receiverId,
        message: text,
        messageType: "text",
        authToken: token ?? undefined,
      });
    };
  }, [db, currentUserId, token]);

  const acceptFirestoreInvite = useMemo(() => {
    return async (chatRoomId: string) => {
      if (!db) throw new Error("Chat not ready");
      await acceptFirestoreChatRequest(db, chatRoomId);
    };
  }, [db]);

  if (!active || !db) {
    return {
      active: false,
      rooms: [],
      messages: [],
      roomMeta: null,
      activeChatRoomId: null,
      isSenderPending: false,
      isRecipientPending: false,
      listError: null,
      listLoaded: false,
      sendFirestoreText: async () => "",
      acceptFirestoreInvite: async () => undefined,
    };
  }

  return {
    active: true,
    rooms,
    messages,
    roomMeta,
    activeChatRoomId,
    isSenderPending,
    isRecipientPending,
    listError,
    listLoaded,
    sendFirestoreText,
    acceptFirestoreInvite,
  };
}
