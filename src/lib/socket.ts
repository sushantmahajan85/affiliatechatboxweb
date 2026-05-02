import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://online-media-tools-server-vercel.vercel.app";
    // Connect to the backend socket
    socket = io(backendUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
};
