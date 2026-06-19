import { getApiBaseUrl } from "@/lib/api-base-url";
import { io, Socket } from "socket.io-client";

export type ChatSocketPayload = {
  senderId?: string;
  receiverId?: string;
  message?: string;
  messageType?: string;
};

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const backendUrl = getApiBaseUrl();
    socket = io(backendUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
};
