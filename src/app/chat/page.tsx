"use client";

import { api, setAuthToken } from "@/api/api";
import { getToken, getUserIdFromToken } from "@/utils/tokenStorage";
import { useEffect, useState } from "react";
import Conversions from "./Conversions";
import ChatRoom from "./ChatRoom";
import { Conversation } from "@/types/conversation";
import { User } from "@/types/user";
import useSocket from "@/hooks/useSocket";
import { Message } from "@/types/message";

export default function Home() {
  const token = getToken();
  const userId = getUserIdFromToken(token);
  const socket = useSocket(userId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fetchingMessages, setFetchingMessages] = useState<string[]>([]);
  const [MessageLoader, setMessageLoader] = useState<boolean>(false);

  // fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setAuthToken(token);
      const response = await api.get("/chat/conversations");
      setConversations(response.data);
    };
    const fetchCurrentUser = async () => {
      setAuthToken(token);
      const response = await api.get("/users/me");
      setCurrentUser(response.data);
    };
    try {
      if (!token) return;
      setLoading(true);
      fetchCurrentUser();
      fetchConversations();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMessages = async () => {
    if (!conversation) return;
    setMessageLoader(true);
    setAuthToken(token);
    const { data } = await api.get(`/chat/messages/${conversation.id}`);
    setFetchingMessages((prev) => [...prev, conversation.id]);
    setMessages((prev) => [...prev, ...data]);
    setMessageLoader(false);
  };

  useEffect(() => {
    if (!conversation) return;
    if (fetchingMessages.includes(conversation.id)) return;
    fetchMessages();
  }, [conversation]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (message: Message) => {
      console.log("new message", message);
      setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket.off("newMessage");
    };
  }, [socket]);

  return loading ? (
    <div>Loading...</div>
  ) : (
    <div className="flex">
      <Conversions
        conversations={conversations}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setConversation={setConversation}
      />
      {conversation ? (
        <ChatRoom
          messages={messages}
          loading={MessageLoader}
          conversation={conversation}
          setMessages={setMessages}
          socket={socket}
          currentUser={currentUser}
        />
      ) : (
        <div>Select a conversation</div>
      )}
    </div>
  );
}
