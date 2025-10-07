import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Chat, ChatMessage, RawMessageData } from '../types/chat';
import { localCache } from '../lib/localCache';

// Plain text messages implementation
export const useChatList = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Try to load from cache first
    const cachedChats = localCache.chats.getAll();
    if (cachedChats) {
      const userChats = Object.values(cachedChats).filter(chat => 
        chat.metadata.participants.includes(user.id)
      );
      setChats(userChats);
      setLoading(false);
    }

    const chatsRef = ref(database, `userChats/${user.id}`);
    const unsubscribe = onValue(chatsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.val();
        const chatMap = new Map();
        
        // Get only the last 20 chats for initial load
        const sortedChatIds = Object.entries(chatData)
          .sort(([, timestamp]: [string, number], [, b]: [string, number]) => b - timestamp)
          .slice(0, 20)
          .map(([id]) => id);

        await Promise.all(
          sortedChatIds.map(async (chatId) => {
            // Try to get from cache first
            const allCachedChats = localCache.chats.getAll();
            const cachedChat = allCachedChats?.[chatId];
            if (cachedChat && Date.now() - cachedChat.metadata.updatedAt < 5 * 60 * 1000) { // 5 min cache
              chatMap.set(chatId, cachedChat);
              return;
            }

            const chatRef = ref(database, `chats/${chatId}`);
            const chatSnapshot = await get(chatRef);
            const chatDataObj = chatSnapshot.val() || {};
            const lastMessage = chatDataObj.lastMessage || {};
            const createdTimestamp = chatData[chatId] || Date.now();
            let participantsArr = [];
            let participantIds: string[] = [];
            if (chatDataObj.participants && typeof chatDataObj.participants === 'object') {
              participantIds = Object.keys(chatDataObj.participants);
              participantsArr = Object.entries(chatDataObj.participants).map(([pid, pDataRaw]) => {
                const pData = pDataRaw as { name?: string; avatar?: string; profileImage?: string; lastSeen?: any; isActive?: boolean };
                return {
                  userId: pid,
                  name: pData.name || '',
                  avatar: pData.avatar || '',
                  profileImage: pData.profileImage || '',
                  lastSeen: pData.lastSeen || null,
                  isActive: pData.isActive || false
                };
              });
            }
            // Use sorted participant IDs to normalize chatId
            const normalizedChatId = participantIds.length > 0 ? [...participantIds].sort().join('_') : chatId;
            if (chatMap.has(normalizedChatId)) return;
            chatMap.set(normalizedChatId, {
              id: normalizedChatId,
              metadata: {
                lastMessage: {
                  content: lastMessage.text || '',
                  timestamp: Number(lastMessage.timestamp || createdTimestamp),
                  senderId: lastMessage.senderId || ''
                },
                updatedAt: Number(lastMessage.timestamp || createdTimestamp),
                createdAt: Number(createdTimestamp),
                participants: participantIds
              },
              participants: participantsArr,
              unreadCount: chatDataObj.unreadCount || { [user.id]: 0 }
            });
          })
        );
        const chatList = Array.from(chatMap.values());
        chatList.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt);
        setChats(chatList);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  return { chats, loading };
};

export const useOptimizedChat = (otherUserId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load messages for specific chat
  // Mark messages as read when the recipient views them
  const markMessagesAsRead = useCallback(async (messages: ChatMessage[]) => {
    if (!user?.id || !otherUserId) return;

    const chatId = [user.id, otherUserId].sort().join('_');
    const unreadMessages = messages.filter(msg => 
      msg.receiverId === user.id && !msg.read
    );

    if (unreadMessages.length > 0) {
      const updates: Record<string, boolean> = {};
      unreadMessages.forEach(msg => {
        updates[`chats/${chatId}/messages/${msg.id}/read`] = true;
      });
      await update(ref(database), updates);
    }
  }, [user?.id, otherUserId]);

  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    const chatId = [user.id, otherUserId].sort().join('_');
    
    // Load from cache first
    const cachedMessages = localCache.messages.get(chatId);
    if (cachedMessages) {
      setMessages(cachedMessages);
      setLoading(false);
    }

    // Then sync with Firebase
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const messagePromises = Object.entries(rawData as Record<string, RawMessageData>).map(
          async ([key, msg]) => {
            // Handle both encrypted and plain text messages
            let messageText = msg.text || msg.content || msg.message;
            
            // If no plain text but has encrypted content, show placeholder
            if (!messageText && msg.encryptedContent) {
              messageText = '[Encrypted message]';
            } else if (!messageText) {
              messageText = '[Empty message]';
            }
            
            return {
              id: key,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              text: messageText,
              timestamp: msg.timestamp,
              read: msg.read || false
            };
          }
        );

        const messages = await Promise.all(messagePromises);
        const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

        // Mark messages as read if recipient is viewing them
        await markMessagesAsRead(sortedMessages);

        // Update cache and state
        localCache.messages.set(chatId, sortedMessages);
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, otherUserId, markMessagesAsRead]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id || !otherUserId) return;

      const chatId = [user.id, otherUserId].sort().join('_');
      const messageRef = push(ref(database, `chats/${chatId}/messages`));
      const messageId = messageRef.key || Math.random().toString(36).substr(2, 9);
      const timestamp = Date.now();

      try {
        // Save the plain text message
        await set(messageRef, {
          id: messageId,
          senderId: user.id,
          receiverId: otherUserId,
          text: content,
          timestamp: timestamp,
          read: false
        });

        // Update chat metadata
        const chatRef = ref(database, `chats/${chatId}`);
        await update(chatRef, {
          lastMessage: {
            text: content,
            timestamp: timestamp,
            senderId: user.id
          },
          updatedAt: timestamp,
          [`unreadCount/${otherUserId}`]: 1
        });

        // Ensure chat is in user's chat list
        const userChatsRef = ref(database, `userChats/${user.id}/${chatId}`);
        const otherUserChatsRef = ref(database, `userChats/${otherUserId}/${chatId}`);
        await Promise.all([
          set(userChatsRef, timestamp),
          set(otherUserChatsRef, timestamp)
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [user?.id, otherUserId]
  );

  return {
    messages,
    loading,
    sendMessage
  };
};