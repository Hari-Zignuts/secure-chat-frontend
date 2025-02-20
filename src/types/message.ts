import { Conversation } from "./conversation";
import { User } from "./user";

export interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: User;
  conversation: Conversation;
}