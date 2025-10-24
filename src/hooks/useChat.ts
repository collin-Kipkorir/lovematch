import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, set, onValue, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage, ChatParticipant } from '@/types/chat';
import { encryptMessage, decryptMessage, generateEncryptionKey, exportPublicKey, importPublicKey } from '@/lib/encryption';
import { localCache } from '@/lib/localCache';
import { useToast } from '@/hooks/use-toast';

export const useChat = (otherUserId?: string) => {
  const { user, updateCredits } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [otherUserPublicKey, setOtherUserPublicKey] = useState<CryptoKey | null>(null);
  const { toast } = useToast();

  // Request notification permission when chat is opened
  useEffect(() => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive message notifications',
          });
        }
      });
    }
  }, [toast]);

  // Extend ChatMessage to allow encryptedContent for internal use
  type ChatMessageWithEncrypted = ChatMessage & { encryptedContent?: string };

  // Generate or retrieve encryption keys on component mount
  // Load messages from localStorage first
  useEffect(() => {
    if (!user || !otherUserId) return;
    const chatId = [user.id, otherUserId].sort().join('_');
    const cached = localCache.messages.get(chatId);
    if (cached && Array.isArray(cached)) {
      setMessages(cached);
      setLocalLoaded(true);
      setLoading(false);
    }
  }, [user, otherUserId]);

  useEffect(() => {
    const initializeKeys = async () => {
      if (!user) return;
      
      try {
        // Check if we already have keys stored
        const keysRef = ref(database, `userKeys/${user.id}`);
        const snapshot = await get(keysRef);
        
        if (!snapshot.exists()) {
          // Generate new keys if none exist
          const newKeyPair = await generateEncryptionKey();
          const publicKeyString = await exportPublicKey(newKeyPair.publicKey);
          
          // Store public key in database
          await set(keysRef, {
            publicKey: publicKeyString
          });
          
          setKeyPair(newKeyPair);
        } else {
          // Retrieve existing key pair
          try {
            const publicKeyString = snapshot.val().publicKey;
            const existingKeyPair = await generateEncryptionKey(); // Generate new private key
            const existingPublicKey = await importPublicKey(publicKeyString);
            
            setKeyPair({
              publicKey: existingPublicKey,
              privateKey: existingKeyPair.privateKey
            });
          } catch (error) {
            console.error('Error importing existing keys:', error);
            // If key import fails, generate new keys
            const newKeyPair = await generateEncryptionKey();
            const publicKeyString = await exportPublicKey(newKeyPair.publicKey);
            
            await set(keysRef, {
              publicKey: publicKeyString
            });
            
            setKeyPair(newKeyPair);
          }
        }
      } catch (error) {
        console.error('Error initializing encryption keys:', error);
        toast({
          title: "Error",
          description: "Failed to initialize chat encryption",
          variant: "destructive"
        });
      }
    };

    initializeKeys();
  }, [user, toast]);

  useEffect(() => {
    if (!user || !otherUserId || !keyPair) return;

  // Get other user's public key
  const getOtherUserKey = async () => {
      try {
        const keyRef = ref(database, `userKeys/${otherUserId}`);
        const snapshot = await get(keyRef);
        
        if (snapshot.exists()) {
          const publicKeyString = snapshot.val().publicKey;
          const publicKey = await importPublicKey(publicKeyString);
          setOtherUserPublicKey(publicKey);
        } else {
          toast({
            title: "Error",
            description: "Could not find other user's encryption key",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error getting other user key:', error);
        toast({
          title: "Error",
          description: "Failed to setup secure chat",
          variant: "destructive"
        });
      }
    };

    getOtherUserKey();

    // Get chat ID (combine user IDs in alphabetical order)
    const chatId = [user.id, otherUserId].sort().join('_');
    const chatRef = ref(database, `chats/${chatId}/messages`);

    // Function to show in-app notification
    const showInAppNotification = (message: ChatMessage, senderName: string) => {
      if (message.receiverId === user.id && !message.read && Notification.permission === 'granted') {
        const notification = new Notification(senderName || 'New Message', {
          body: message.content || 'You have received a new message',
          icon: '/opengraph-image.png',
          tag: `chat_${chatId}`,
          requireInteraction: true
        });

        notification.onclick = () => {
          notification.close();
          window.focus();
          window.location.href = `/chat/${chatId}`;
        };

        // Play notification sound
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(err => console.log('Failed to play notification sound:', err));
      }
    };

    // Listen for new messages
    const unsubscribe = onValue(chatRef, async (snapshot) => {
      if (snapshot.exists() && keyPair) {
        const messagesData = snapshot.val();
        const messagesList = Object.values(messagesData) as ChatMessage[];
        // Decrypt messages meant for current user
        const decryptedMessages = await Promise.all(
          messagesList.map(async (msg) => {
            if (msg.receiverId === user.id) {
              try {
                const decryptedContent = await decryptMessage(msg.encryptedContent, keyPair.privateKey);
                return { ...msg, content: decryptedContent };
              } catch (error) {
                console.error('Error decrypting message:', error);
                return { ...msg, content: 'Message cannot be decrypted' };
              }
            }
            // For sent messages, show original content
            return msg;
          })
        );
        // Sort messages by timestamp
        const sortedMessages = decryptedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sortedMessages);
        
        // Update localStorage cache
        localCache.messages.set(chatId, sortedMessages);

        // Check for new messages and show notifications
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        if (lastMessage && lastMessage.timestamp > Date.now() - 1000 && lastMessage.receiverId === user.id) {
          // Get sender's name from database
          const senderRef = ref(database, `users/${lastMessage.senderId}/displayName`);
          const senderSnapshot = await get(senderRef);
          const senderName = senderSnapshot.exists() ? senderSnapshot.val() : 'Someone';
          
          // Show in-app notification
          showInAppNotification(lastMessage, senderName);
        }
        
        // Mark messages as read if they're for the current user
        const unreadMessages = messagesList.filter(
          msg => msg.receiverId === user.id && !msg.read
        );
        if (unreadMessages.length > 0) {
          const updates = {};
          unreadMessages.forEach(msg => {
            updates[`${msg.id}/read`] = true;
          });
          await update(chatRef, updates);
          // Reset unread count for current user
          const unreadRef = ref(database, `chats/${chatId}/unreadCount/${user.id}`);
          await set(unreadRef, 0);
        }
      } else {
        setMessages([]);
        localCache.messages.set(chatId, []);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, otherUserId, keyPair, toast]);

  const sendMessage = async (content: string) => {
    if (!user || !otherUserId || !otherUserPublicKey || !keyPair) {
      toast({
        title: "Error",
        description: "Chat not properly initialized",
        variant: "destructive"
      });
      return;
    }

    // Check if user has enough credits
    if (user.credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase more credits to continue chatting",
        variant: "destructive"
      });
      return;
    }

    try {
      const chatId = [user.id, otherUserId].sort().join('_');
      // Ensure chat exists and is initialized
      const chatRef = ref(database, `chats/${chatId}`);
      const chatSnapshot = await get(chatRef);
      if (!chatSnapshot.exists()) {
        // Initialize chat if it doesn't exist
        await set(chatRef, {
          metadata: {
            participants: [user.id, otherUserId],
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          messages: {},
          unreadCount: {
            [user.id]: 0,
            [otherUserId]: 0
          }
        });
      }
      const messageRef = push(ref(database, `chats/${chatId}/messages`));
      // Encrypt message
      const encryptedContent = await encryptMessage(content, otherUserPublicKey);
      const newMessage: ChatMessage = {
        id: messageRef.key!,
        senderId: user.id,
        receiverId: otherUserId,
        encryptedContent,
        timestamp: Date.now(),
        read: false,
      };
      // Optimistically update localStorage and UI
      setMessages(prev => {
        const updated = [...prev, { ...newMessage, content }];
        localCache.messages.set(chatId, updated);
        return updated;
      });
      // Start a transaction to update both message and credits
      await set(messageRef, newMessage);
      // Update chat metadata
      const chatMetadataRef = ref(database, `chats/${chatId}/metadata`);
      await update(chatMetadataRef, {
        lastMessage: {
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''), // Preview only
          timestamp: Date.now(),
          senderId: user.id
        },
        updatedAt: Date.now(),
        participants: [user.id, otherUserId],
        createdAt: Date.now()
      });
      // Deduct credit
      updateCredits(-1);
      // Update unread count for receiver
      const unreadRef = ref(database, `chats/${chatId}/unreadCount/${otherUserId}`);
      const unreadSnapshot = await get(unreadRef);
      const currentUnread = unreadSnapshot.exists() ? unreadSnapshot.val() : 0;
      await set(unreadRef, currentUnread + 1);

      // Send notification data
      const notificationRef = ref(database, `notifications/${otherUserId}`);
      const notificationData = {
        type: 'message',
        senderId: user.id,
        senderName: user.displayName || 'Someone',
        chatId,
        message: content.substring(0, 100),
        timestamp: Date.now(),
        read: false
      };
      await push(notificationRef, notificationData);

      toast({
        title: "Message Sent",
        description: `Remaining credits: ${user.credits - 1}`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user || !otherUserId) return;

    const chatId = [user.id, otherUserId].sort().join('_');
    await set(ref(database, `chats/${chatId}/messages/${messageId}/read`), true);
  };

  // Background sync: if localLoaded and online, sync local messages to DB if needed
  useEffect(() => {
    if (!user || !otherUserId || !localLoaded) return;
    // Optionally, implement background sync logic here
    // For now, just a placeholder for future expansion
  }, [user, otherUserId, localLoaded, messages]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
};

// Hook for fetching all chats
export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userChatsRef = ref(database, 'chats');
    const userChatsQuery = query(
      userChatsRef,
      orderByChild('participants'),
      equalTo(user.id)
    );

    const unsubscribe = onValue(userChatsQuery, async (snapshot) => {
      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const chatsArray = Object.values(chatsData) as Chat[];
        
        // Sort chats by last message timestamp
        const sortedChats = chatsArray.sort((a, b) => {
          return (b.metadata?.lastMessage?.timestamp || 0) - (a.metadata?.lastMessage?.timestamp || 0);
        });

        setChats(sortedChats);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { chats, loading };
};