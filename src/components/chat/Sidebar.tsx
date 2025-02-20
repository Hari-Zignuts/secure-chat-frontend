"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  conversations: any[];
  setConversationId: (id: string) => void;
  setSelectedUser: (id: string) => void;
  selectedUser: string | null;
}

export default function Sidebar({
  conversations,
  setConversationId,
  setSelectedUser,
  selectedUser,
}: SidebarProps) {
  return (
    <div className="w-1/3 border-r bg-white p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Chats</h2>
      <ScrollArea className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-3 cursor-pointer rounded-lg flex items-center gap-3 hover:bg-gray-200 transition ${
              selectedUser === conv.user.id ? "bg-green-200" : ""
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
    </div>
  );
}