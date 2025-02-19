"use client";
import { useEffect, useState } from "react";
import { getToken, getUserIdFromToken } from "@/utils/tokenStorage";
import useSocket from "@/hooks/useSocket";
import { api, setAuthToken } from "@/api/api";
export default function Chat() {
  const token = getToken();

  const userId = getUserIdFromToken(token);
  const socket = useSocket(userId);

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([{}]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setAuthToken(token);
        const data = await api.get("/chat/conversations");
        setConversations(data.data);
      } catch (error) {
        console.error("Error fetching conversations", error);
      }
    };
    const fetchUsers = async () => {
      try {
        setAuthToken(token);
        const { data } = await api.get("/users");
        const filteredData = data.filter((user) => user.id !== userId);
        setUsers(filteredData);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };
    const fetchMessages = async () => {
      if (conversationId) {
        setAuthToken(token);
        const { data } = await api.get(`/chat/messages/${conversationId}`);
        if (!data || data.length === 0) {
          setMessages([]);
          return;
        }
        const oldMessages = data.map((msg) => ({
          message: msg.message,
          createdAt: msg.createdAt,
          isSender: msg.senderId === userId,
        }));
        setMessages(oldMessages);
      }
    };
    fetchConversations();
    fetchUsers();
    fetchMessages();
  }, [selectedUser, token, conversationId]);

  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (msg) => {
        console.log("Received message", msg);
        setMessages((prev) => [...prev, msg]);
      });
    }
  }, [socket]);

  const sendMessage = () => {
    if (socket && selectedUser && message.trim()) {
      socket.emit("sendMessage", {
        senderId: userId,
        receiverId: selectedUser,
        message,
      });
      setMessages([
        ...messages,
        { message, isSender: true, createdAt: new Date() },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r p-4">
        <h2 className="text-xl mb-4">Users</h2>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-2 cursor-pointer ${
              conversationId === conversation.id ? "bg-blue-200" : ""
            }`}
            onClick={() => {
              setConversationId(conversation.id);
              setSelectedUser(conversation.user.id);
            }}
          >
            {conversation?.user?.email}
          </div>
        ))}
        {users.map((user) => (
          <div
            key={user.id}
            className={`p-2 cursor-pointer ${
              selectedUser === user.id ? "bg-blue-200" : ""
            }`}
            onClick={() => setSelectedUser(user.id)}
          >
            {user.email}
          </div>
        ))}
      </div>

      <div className="w-2/3 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages &&
            messages.map((msg, index) => <div key={index}>{msg.message}</div>)}
        </div>

        <div className="p-4 border-t flex">
          <input
            className="flex-1 border p-2"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 ml-2"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
