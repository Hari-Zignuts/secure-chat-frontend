"use client";

import { api, setAuthToken } from "@/api/api";
import useSocket from "@/hooks/useSocket";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";
import { User } from "@/types/user";
import { getToken, getUserIdFromToken, removeToken } from "@/utils/tokenStorage";
import { v4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

export default function Home() {
  const token = getToken();
  const userId = getUserIdFromToken(token);
  const socket = useSocket(userId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fetchedConversationMessages, setFetchedConversationMessages] =
    useState<string[]>([]);
  const [messageLoader, setMessageLoader] = useState<boolean>(false);
  const [selectedUserMessages, setSelectedUserMessages] = useState<Message[]>(
    []
  );
  const [message, setMessage] = useState<string>("");

  const conversationRef = useRef(conversations);
  conversationRef.current = conversations;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setAuthToken(token);
        const conversationsResponse = await api.get("/chat/conversations");
        const usersResponse = await api.get("/users");
        const currentUserResponse = await api.get("/users/me");

        // remove users that are in conversations and currentuser
        const filterUsersResponse = usersResponse.data.filter(
          (user: User) =>
            !conversationsResponse.data.some(
              (conversation: Conversation) => conversation.user.id === user.id
            ) && user.id !== currentUserResponse.data.id
        );

        setConversations(conversationsResponse.data);
        setUsers(filterUsersResponse);
        setCurrentUser(currentUserResponse.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!conversation) return;
    const fetchMessages = async () => {
      try {
        setMessageLoader(true);
        if (fetchedConversationMessages.includes(conversation.id)) return;
        setAuthToken(token);
        const response = await api.get(`/chat/messages/${conversation?.id}`);
        setMessages((prev) => {
          return prev.filter(
            (message) => message.conversation.id !== conversation.id
          );
        });
        setMessages((prev) => [...prev, ...response.data]);
        setFetchedConversationMessages((prev) => [...prev, conversation.id]);
      } catch (error) {
        console.error(error);
      } finally {
        setMessageLoader(false);
      }
    };
    fetchMessages();
  }, [conversation]);

  useEffect(() => {
    if (!conversation) {
      setSelectedUserMessages([]);
      return;
    }
    setSelectedUserMessages(
      messages
        .filter((message) => message.conversation.id === conversation?.id)
        .sort()
    );
  }, [messages, conversation]);

  function selectUser(user: User) {
    // find conversion if found set it to selectedUser
    const conversation = conversations.find(
      (conversation) => conversation.user.id === user.id
    );
    if (conversation) {
      setConversation(conversation);
    } else {
      setConversation(null);
    }
    setSelectedUser(user);
  }

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || !currentUser || !socket) return;
    socket.emit("sendMessage", {
      message,
      senderId: currentUser.id,
      receiverId: selectedUser.id,
    });
    const newMessage: Partial<Message> = {
      id: v4(),
      message,
      createdAt: new Date().toISOString(),
      sender: currentUser,
    };
    if (conversation) {
      const newConversation: Conversation = {
        id: conversation.id,
        user: conversation.user,
        lastMessageAt: new Date().toISOString(),
      };
      setConversation(newConversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? newConversation : conv
        )
      );
      newMessage.conversation = newConversation;
    }
    if (!conversation) {
      const newConversation: Conversation = {
        id: v4(),
        user: selectedUser,
        lastMessageAt: new Date().toISOString(),
      };
      setConversation(newConversation);
      setFetchedConversationMessages((prev) => [...prev, newConversation.id]);
      setConversations((prev) => [...prev, newConversation]);
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      newMessage.conversation = newConversation;
    }
    setMessages((prev) => [...prev, newMessage as Message]);
    setMessage("");
  };

  useEffect(() => {
    if (!socket) return;
    const messageHandler = (newMessage: Message) => {
      const isConversionExist = conversationRef.current.find(
        (conversation) => conversation.user.id === newMessage.sender.id
      );
      if (!isConversionExist) {
        setConversations((prev) => [
          ...prev,
          {
            id: newMessage.conversation.id,
            user: newMessage.sender,
            lastMessageAt: newMessage.createdAt,
          },
        ]);
        setUsers((prev) =>
          prev.filter((user) => user.id !== newMessage.sender.id)
        );
        setMessages((prev) => [...prev, newMessage]);
      } else {
        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation.user.id === newMessage.sender.id) {
              return {
                ...conversation,
                lastMessageAt: newMessage.createdAt,
              };
            }
            return conversation;
          })
        );
        const updatedMessage = {
          ...newMessage,
          conversation: isConversionExist,
        };
        setMessages((prev) => [...prev, updatedMessage]);
      }
    };
    socket.on("receiveMessage", messageHandler);
    return () => {
      socket.off("receiveMessage", messageHandler);
    };
  }, [socket]);

  const router = useRouter();
  const { setToast, showToast, getToast } = useToast();
  useEffect(() => {
    if (getToast() !== null) {
      showToast();
    }
  }, [showToast, getToast]);
  const handleLogout = () => {
    router.replace("/auth/login");
    setToast("Logout successful.");
    removeToken();
  };

  return loading ? (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold">Loading...</div>
    </div>
  ) : (
    <div className="flex flex-col md:flex-row h-screen">
      <aside className="w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-700">Conversations</h1>
            {[...conversations]
              .sort(
                (a, b) =>
                  new Date(b.lastMessageAt).getTime() -
                  new Date(a.lastMessageAt).getTime()
              )
              .map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectUser(conversation.user)}
                  className={`p-2 mt-2 rounded cursor-pointer ${
                    selectedUser?.id === conversation.user.id
                      ? "bg-blue-200"
                      : "bg-white"
                  }`}
                >
                  {conversation.user.name} -{" "}
                  {new Date(conversation.lastMessageAt).toLocaleString()}
                </div>
              ))}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-700">Users</h1>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => selectUser(user)}
                className={`p-2 mt-2 rounded cursor-pointer ${
                  selectedUser?.id === user.id ? "bg-blue-200" : "bg-white"
                }`}
              >
                {user.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          {currentUser && (
            <div className="mt-4">
              <div className="flex items-center mt-2">
                <Image
                  src={currentUser.avatar || "/default-avatar.png"}
                  alt={currentUser.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <div className="text-lg font-semibold">
                    {currentUser.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 w-full mt-4 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {selectedUser?.name || "Select a user to continue chat"}
        </h1>
        <div className="flex-1 overflow-y-auto flex flex-col-reverse">
          {messageLoader && selectedUser ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="space-y-4">
              {selectedUserMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded ${
                    message.sender.id === currentUser?.id
                      ? "bg-blue-100 self-end"
                      : "bg-gray-200 self-start"
                  }`}
                >
                  <div className="text-sm">{message.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedUser && (
          <form className="mt-4 flex" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type here..."
              className="flex-1 p-2 border rounded-l"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="bg-blue-500 text-white p-2 rounded-r">
              Send
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
