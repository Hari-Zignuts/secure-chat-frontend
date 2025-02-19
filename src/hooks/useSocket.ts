import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (userId) {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const newSocket = io(API_URL, { query: { userId } });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userId]);

  return socket;
};

export default useSocket;
