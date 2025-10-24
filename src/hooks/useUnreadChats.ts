import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const useUnreadChats = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      setUnreadChats(new Set());
      return;
    }

    // Listen to recent chat updates for better performance
    const userChatsRef = ref(database, `userChats/${user.id}`);
    const recentChatsQuery = query(userChatsRef, orderByChild('timestamp'), limitToLast(20));

    const unsubscribe = onValue(recentChatsQuery, async (snapshot) => {
      if (!snapshot.exists()) {
        setUnreadCount(0);
        setUnreadChats(new Set());
        return;
      }

      try {
        let count = 0;
        const unreadChatIds = new Set<string>();

        const chatPromises = Object.keys(snapshot.val()).map(async (chatId) => {
          const chatRef = ref(database, `chats/${chatId}/messages`);
          const messagesSnap = await get(chatRef);
          
          if (messagesSnap.exists()) {
            const messages = messagesSnap.val();
            // Count unread messages in the last 24 hours
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

            Object.values(messages).forEach((msg: { receiverId: string; read?: boolean; timestamp: number }) => {
              if (
                msg.receiverId === user.id && 
                !msg.read && 
                msg.timestamp > twentyFourHoursAgo
              ) {
                count++;
                unreadChatIds.add(chatId);
              }
            });
          }
        });

        await Promise.all(chatPromises);
        setUnreadCount(count);
        setUnreadChats(unreadChatIds);

      } catch (error) {
        console.error('Error processing unread messages:', error);
        // Keep the previous state on error
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  return { 
    unreadCount,
    hasUnreadChat: (chatId: string) => unreadChats.has(chatId),
    unreadChats: Array.from(unreadChats)
  };
};
