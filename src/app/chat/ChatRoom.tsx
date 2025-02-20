import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

function ChatRoom({
  messages,
  loading,
  conversation,
  socket,
  setMessages,
  currentUser,
}: {
  messages: Message[];
  loading: boolean;
  conversation: Conversation | null;
  socket: Socket | null;
  currentUser: User | null;
  setMessages: (messages: Message[]) => void;
}) {
  const [activeMessage, setActiveMessage] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!conversation) return;
    setActiveMessage(
      messages.filter(
        (message: Message) => message.conversation.id === conversation.id
      )
    );
  }, [conversation, messages]);

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    if (!conversation || !socket || !message.trim() || !currentUser) return;
    e.preventDefault();
    socket.emit("sendMessage", {
      message,
      senderId: currentUser.id,
      receiverId: conversation.user.id,
    });
    const newMessage: Message = {
      id: Math.random().toString(),
      message,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      conversation: conversation,
    };
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div>
      <div>ChatRoom</div>
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {activeMessage.map((message: Message) => (
              <div key={message.id}>
                {message.message} - {message.createdAt} -{" "}
                {message.sender.id === conversation?.user.id ? "other" : "me"}
              </div>
            ))}
            <form onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type Here..."
                value={message}
                onChange={handleMessageChange}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatRoom;
