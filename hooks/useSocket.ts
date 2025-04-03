import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://chat-server-wvxo.onrender.com"; // Connect to the separate WebSocket server

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      //console.log("Connected to WebSocket server:", socketInstance.id);
    });

    socketInstance.on("disconnect", () => {
      //console.log("Disconnected from WebSocket server");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit("join_room", { roomId });
    }
  };

  return { socket, joinRoom };
}
