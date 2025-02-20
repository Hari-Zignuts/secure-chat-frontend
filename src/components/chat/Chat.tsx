"use client";

import { useEffect, useState } from "react";
import { getToken, getUserIdFromToken } from "@/utils/tokenStorage";
import useSocket from "@/hooks/useSocket";
import { api, setAuthToken } from "@/api/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const token = getToken();
  const userId = getUserIdFromToken(token);
  const socket = useSocket(userId);

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthToken(token);
        const [conversationsRes, usersRes] = await Promise.all([
          api.get("/chat/conversations"),
          api.get("/users"),
        ]);

        const conversationUsers = conversationsRes.data.map((conv) => conv.user.id);
        const nonConversationUsers = usersRes.data.filter((user) => !conversationUsers.includes(user.id) && user.id !== userId);

        setConversations(conversationsRes.data);
        setUsers(nonConversationUsers);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      try {
        setAuthToken(token);
        const { data } = await api.get(`/chat/messages/${conversationId}`);
        setMessages(
          data.map((msg) => ({
            message: msg.message,
            createdAt: msg.createdAt,
            isSender: msg.sender.id === userId,
          }))
        );
      } catch (error) {
        console.error("Error fetching messages", error);
      }
    };
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off("receiveMessage");
  }, [socket]);

  const sendMessage = () => {
    if (!socket || !selectedUser || !message.trim()) return;
    socket.emit("sendMessage", {
      senderId: userId,
      receiverId: selectedUser,
      message,
    });
    setMessages((prev) => [...prev, { message, isSender: true, createdAt: new Date() }]);
    setMessage("");
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-white p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Chats</h2>

        {/* Conversations List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-3 cursor-pointer rounded-lg flex items-center gap-3 hover:bg-gray-200 transition ${
                conversationId === conv.id ? "bg-green-200" : ""
              }`}
              onClick={() => {
                setConversationId(conv.id);
                setSelectedUser(conv.user.id);
              }}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <span>{conv?.user?.email}</span>
            </div>
          ))}
        </ScrollArea>

        {/* Users Not in Any Conversation */}
        <h3 className="text-lg font-semibold mt-4">Start New Chat</h3>
        <ScrollArea className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="p-3 cursor-pointer rounded-lg flex items-center gap-3 hover:bg-gray-200 transition"
              onClick={() => {
                setSelectedUser(user.id);
                setConversationId(null);
                setMessages([]);
              }}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <span>{user.email}</span>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="w-2/3 flex flex-col bg-white">
        <div className="p-4 border-b flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <span className="ml-3 font-semibold">{selectedUser || "Select a chat"}</span>
        </div>

        <ScrollArea className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-white max-w-xs ${
                msg.isSender ? "bg-green-500 self-end" : "bg-gray-400 self-start"
              }`}
            >
              {msg.message}
              <div className="text-xs opacity-80 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </ScrollArea>

        {/* Input Box */}
        <div className="p-4 border-t flex items-center gap-3 bg-white">
          <Input
            className="flex-1 border p-3 rounded-full"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button className="bg-green-500 text-white rounded-full px-5 py-3" onClick={sendMessage}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}