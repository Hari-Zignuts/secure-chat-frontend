import { User } from "./user";

export interface Conversation {
  id: string;
  user: User;
  lastMessageAt: string;
  lastMessage: string;
}
