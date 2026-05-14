import { getApiBaseUrl } from "@/lib/api-base-url";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const backendUrl = getApiBaseUrl();
    // Connect to the backend socket
    socket = io(backendUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
};
