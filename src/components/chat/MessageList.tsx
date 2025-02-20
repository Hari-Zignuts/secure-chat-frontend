"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: { message: string; isSender: boolean; createdAt: string }[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
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
  );
}