"use client";

import { api, setAuthToken } from "@/api/api";
import useSocket from "@/hooks/useSocket";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";
import { User } from "@/types/user";
import {
  getToken,
  getUserIdFromToken,
  removeToken,
} from "@/utils/tokenStorage";
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
    // Request permission if not granted
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    const fetchData = async () => {
      if (!token) return;
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
    const fetchMessages = async () => {
      if (!conversation) return;
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
  }, [conversation, fetchedConversationMessages, token]);

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
      createdAt: new Date().toISOString(),
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
        lastMessage: message,
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
        lastMessage: message,
      };
      setConversation(newConversation);
      setFetchedConversationMessages((prev) => [...prev, newConversation.id]);
      setConversations((prev) => [...prev, newConversation]);
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      newMessage.conversation = newConversation;
    }
    playSendNotificationSound();
    setMessages((prev) => [...prev, newMessage as Message]);
    setMessage("");
  };

  const [isTabActive, setIsTabActive] = useState(true);

  // Track window/tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const messageHandler = (newMessage: Message) => {
      if(!newMessage.sender) return;
      playReceiveNotificationSound();
      const isConversationExist = conversationRef.current.find(
        (conversation) => conversation.user.id === newMessage.sender.id
      );

      if (!isConversationExist) {
        setConversations((prev) => [
          ...prev,
          {
            id: newMessage.conversation.id,
            user: newMessage.sender,
            lastMessageAt: newMessage.createdAt,
            lastMessage: newMessage.message,
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
                lastMessage: newMessage.message,
              };
            }
            return conversation;
          })
        );

        const updatedMessage = {
          ...newMessage,
          conversation: isConversationExist,
        };

        setMessages((prev) => [...prev, updatedMessage]);
      }

      // Push notification conditions
      if (!isTabActive || selectedUser?.id !== newMessage.sender.id) {
        sendNotification(newMessage);
      }
    };
    socket.on("receiveMessage", messageHandler);
    return () => {
      socket.off("receiveMessage", messageHandler);
    };
  }, [socket, isTabActive, selectedUser]);

  const playReceiveNotificationSound = () => {
    const audio = new Audio('/sounds/receive.mp3'); // path from public folder
    audio.play().catch((err) => {
      console.warn("Autoplay prevented:", err);
    });
  };
  const playSendNotificationSound = () => {
    const audio = new Audio('/sounds/send.mp3'); // path from public folder
    audio.play().catch((err) => {
      console.warn("Autoplay prevented:", err);
    });
  };

  const sendNotification = (message: Message) => {
    if (!("Notification" in window)) return;

    // Request permission if not granted
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      new Notification(`New message from ${message.sender.name}`, {
        body: message.message,
        icon: message.sender.avatar || "/default-avatar.png",
      });
    }
  };

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
      <div className="w-16 h-16 border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  ) : (
    <div className="flex flex-col md:flex-row h-screen">
      <aside className="w-full md:w-1/4 bg-gray-100 p-4 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="mb-4">
            {conversations.length > 0 && (
              <h1 className="text-xl font-bold text-gray-700">Conversations</h1>
            )}
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
                  className={`p-3 mt-2 rounded-lg cursor-pointer flex items-center space-x-3 ${
                    selectedUser?.id === conversation.user.id
                      ? "bg-blue-100"
                      : "bg-white"
                  } hover:bg-gray-50 transition duration-200`}
                >
                  {/* Avatar */}
                  <Image
                    src={conversation.user.avatar || "/default-avatar.png"} // Fallback to default avatar if none exists
                    alt={conversation.user.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    {/* User Name */}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        {conversation.user.name}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(
                          conversation.lastMessageAt
                        ).toLocaleDateString() ===
                        new Date().toLocaleDateString()
                          ? new Date(
                              conversation.lastMessageAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date(
                              conversation.lastMessageAt
                            ).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Last Message */}
                    <div className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div>
            {users.length > 0 && (
              <h1 className="text-xl font-bold text-gray-700">Users</h1>
            )}
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
        <div className="flex items-center mb-4">
          {selectedUser ? (
            <>
              <Image
                src={selectedUser.avatar || "/default-avatar.png"}
                alt={selectedUser.name}
                width={50}
                height={50}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-gray-800 ml-4">
                {selectedUser.name}
              </h1>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800">
              Select a user to start chatting
            </h1>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg shadow-inner flex flex-col-reverse">
          {messageLoader && selectedUser ? (
            <div className="flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedUserMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender.id === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      message.sender.id === currentUser?.id
                        ? "bg-blue-500 text-white self-end"
                        : "bg-gray-200 text-gray-800 self-start"
                    } shadow-md`}
                  >
                    <div className="text-sm">{message.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender.id === currentUser?.id
                          ? "text-blue-200"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleDateString() ===
                      new Date().toLocaleDateString()
                        ? new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedUser && (
          <form
            className="mt-4 flex items-center space-x-2"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="bg-green-500 text-white p-3 rounded shadow-md hover:bg-blue-600 transition duration-300">
              send
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
