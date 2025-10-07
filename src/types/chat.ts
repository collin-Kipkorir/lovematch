export interface RawMessageData {
  id?: string;
  senderId: string;
  receiverId: string;
  text?: string;
  content?: string;
  message?: string;
  encryptedContent?: string;
  timestamp: number;
  read?: boolean;
}

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  content?: string;
  timestamp: number;
  read: boolean;
};

export type ChatMetadata = {
  lastMessage: {
    content: string;
    timestamp: number;
    senderId: string;
  };
  updatedAt: number;
  createdAt: number;
  participants: string[];
};

export type ChatParticipant = {
  userId: string;
  name: string;
  avatar: string;
  lastSeen?: number;
  isTyping?: boolean;
};

export type Chat = {
  id: string;
  metadata: ChatMetadata;
  participants: ChatParticipant[];
  unreadCount: {
    [userId: string]: number;
  };
};

export type ChatsState = {
  [chatId: string]: Chat;
};