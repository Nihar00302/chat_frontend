export interface User {
  userId: string;
  username: string;
  socketId: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

export interface TypingUser {
  userId: string;
  isTyping: boolean;
} 