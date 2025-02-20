"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="p-4 border-t flex items-center gap-3 bg-white">
      <Input
        className="flex-1 border p-3 rounded-full"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <Button className="bg-green-500 text-white rounded-full px-5 py-3" onClick={handleSend}>
        Send
      </Button>
    </div>
  );
}