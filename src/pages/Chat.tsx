import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useOptimizedChat } from '@/hooks/useOptimizedChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Send, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';
import PaymentModal from '@/components/PaymentModal';
import { database } from '@/lib/firebase';
import { ref, get, set, update, onValue, runTransaction } from 'firebase/database';
import { ChatMessage } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * CHAT PAGE - BACKEND INTEGRATION GUIDE
 * 
 * DATABASE SCHEMA:
 * Table: conversations
 * - id (uuid, primary key)
 * - participant_1 (uuid, foreign key to auth.users)
 * - participant_2 (uuid, foreign key to auth.users) 
 * - created_at (timestamp)
 * - last_message_at (timestamp)
 * - is_deleted_by_user1 (boolean) - for soft deletion
 * - is_deleted_by_user2 (boolean) - for soft deletion
 * 
 * Table: messages
 * - id (uuid, primary key)
 * - conversation_id (uuid, foreign key)
 * - sender_id (uuid, foreign key to auth.users)
 * - content (text)
 * - created_at (timestamp)
 * - is_read (boolean)
 * - message_type ('text', 'image', 'system')
 * 
 * REAL-TIME FEATURES:
 * - Message delivery using Supabase Realtime
 * - Typing indicators
 * - Read receipts
 * - Online/offline status
 * 
 * CREDIT SYSTEM:
 * - Deduct credits per message sent
 * - Premium users get unlimited messaging
 * - Track message costs in user_credits table
 * 
 * MODERATION:
 * - Content filtering for inappropriate messages
 * - Report/block functionality
 * - Admin oversight of all conversations
 * - Automated responses via AI moderators
 */

interface ChatProps {
  deleteChatConversation?: (profileId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ deleteChatConversation }) => {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    id: string;
    name: string;
    profileImage: string;
    unread?: number;
  } | null>(null);

  const location = useLocation();
  const chatState = location.state as { chatId: string; otherUser: ChatParticipant } | null;
  const { messages, sendMessage, loading } = useOptimizedChat(profileId);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profileId || !otherUserProfile) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Simple client-side size limit (8MB)
    const MAX_BYTES = 8 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast({
        title: 'Image too large',
        description: 'Please select an image smaller than 8MB.',
        variant: 'destructive'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (user.credits <= 0) {
      setIsPaymentModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const chatId = [user.id, profileId].sort().join('_');
      const storage = getStorage();
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const imgRef = storageRef(storage, `chat_images/${chatId}/${safeName}`);

      await uploadBytes(imgRef, file);
      const downloadUrl = await getDownloadURL(imgRef);

      // Send message — include image metadata so renderer can display it.
      await sendMessage({ text: downloadUrl, imageUrl: downloadUrl, message_type: 'image' } as any);

      // Deduct credit after successful image send
      const userCreditsRef = ref(database, `users/${user.id}/credits`);
      await runTransaction(userCreditsRef, (currentCredits) => {
        return Math.max(0, (currentCredits || 0) - 1);
      });

      // Update local user state
      user.credits = Math.max(0, user.credits - 1);

      toast({
        title: "Image Sent",
      
        variant: "default"
      });

      // Clear typing indicator after sending
      await set(ref(database, `chats/${chatId}/typing/${user.id}`), false);
    } catch (error) {
      console.error('Error uploading/sending image:', error);
      toast({
        title: 'Error',
        description: 'Failed to send image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!profileId) {
      navigate('/');
      return;
    }

    const chatId = [user.id, profileId].sort().join('_');

    // If we have state from navigation, use it immediately
    if (chatState?.otherUser) {
      setOtherUserProfile(chatState.otherUser);
    }

    // Set up real-time listener for the other user's profile
    const userRef = ref(database, `users/${profileId}`);
    const chatRef = ref(database, `chats/${chatId}/messages`);
    const typingRef = ref(database, `chats/${chatId}/typing/${profileId}`);

    const unsubscribeProfile = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setOtherUserProfile(prev => ({
          ...prev,
          ...userData,
        }));
      } else if (!chatState?.otherUser) {
        navigate('/');
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
      }
    });

    // Listen for messages and handle read receipts
    const unsubscribeMessages = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const updates: Record<string, boolean> = {};
        const messageData = snapshot.val();

        Object.entries(messageData).forEach(([key, message]: [string, ChatMessage]) => {
          if (message.receiverId === user.id && !message.read) {
            updates[`${key}/read`] = true;
          }
        });

        if (Object.keys(updates).length > 0) {
          update(chatRef, updates);
        }
      }
    });

    // Listen for typing indicator
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      setIsTyping(snapshot.exists() && snapshot.val() === true);
    });

    const currentTypingTimeoutRef = typingTimeoutRef.current;

    // Cleanup function
    return () => {
      unsubscribeProfile();
      unsubscribeMessages();
      unsubscribeTyping();
      // Clear typing indicator when leaving
      set(ref(database, `chats/${chatId}/typing/${user.id}`), false);
      // Clear any pending typing timeout
      if (currentTypingTimeoutRef) {
        clearTimeout(currentTypingTimeoutRef);
      }
    };
  }, [user, profileId, navigate, toast, chatState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !profileId || !otherUserProfile) return;

    if (user.credits <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    // Store current credit amount for rollback if needed
    const previousCredits = user.credits;

    try {
      await sendMessage(newMessage);

      // Clear typing indicator after sending message
      const chatId = [user.id, profileId].sort().join('_');
      await set(ref(database, `chats/${chatId}/typing/${user.id}`), false);

      // Deduct credit after successful message send
      const userCreditsRef = ref(database, `users/${user.id}/credits`);
      await runTransaction(userCreditsRef, (currentCredits) => {
        return Math.max(0, (currentCredits || 0) - 1);
      });

      // Update local user state
      user.credits = Math.max(0, user.credits - 1);

      toast({
        title: "Message Sent",
      
        variant: "default"
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  /**
   * DELETE CHAT FUNCTIONALITY
   * TODO: Backend Integration - Replace with API call
   */
  const handleDeleteChat = () => {
    if (!profileId || !otherUserProfile) return;

    if (window.confirm(`Are you sure you want to delete this conversation with ${otherUserProfile.name}? This action cannot be undone.`)) {
      deleteChatConversation(profileId);
      localStorage.removeItem(`chat_${profileId}`);

      toast({
        title: "Chat Deleted",
        description: `Conversation with ${otherUserProfile.name} has been deleted.`,
      });

      navigate('/chats');
    }
  };

  if (!otherUserProfile || !user) {
    return null;
  }

  const isLikelyImage = (message: ChatMessage) => {
    const m = message as any;
    if (m.message_type === 'image') return true;
    if (m.imageUrl) return true;
    if (typeof m.text === 'string') {
      if (m.text.startsWith('data:')) return true;
      if (/https?:\/\/.*\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(m.text)) return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900">
        <Header />
      </div>

      <div className="fixed top-[4rem] left-0 right-0 z-30 bg-gray-900">
        <div className="flex items-center border-b bg-gray-800 shadow-sm px-4 py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center w-full">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate('/') }>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="w-10 h-10 mr-3">
              {otherUserProfile.profileImage ? (
                <img src={otherUserProfile.profileImage} alt={otherUserProfile.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <img src="/placeholder.svg" alt="User" className="w-full h-full object-cover rounded-full" />
              )}
            </Avatar>
            <div className="flex flex-col flex-1">
              <h2 className="font-semibold">{otherUserProfile.name}</h2>
              <span className="text-xs text-muted-foreground">
                {otherUserProfile.age ? `${otherUserProfile.age} years old` : ''}
              </span>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteChat}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        <ScrollArea className="flex-1 px-4 py-2 bg-gray-900 pb-28 pt-32 mt-[8rem]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-semibold">Start a Conversation</p>
              <p className="text-sm text-muted-foreground">Say hello to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => {
                const isMe = message.senderId === user.id;
                const showAvatar = !isMe && (!messages[index - 1] || messages[index - 1].senderId !== message.senderId);
                const showTimestamp = !messages[index + 1] || new Date(messages[index + 1].timestamp).getDate() !== new Date(message.timestamp).getDate();
                const imageMessage = isLikelyImage(message);

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {format(new Date(message.timestamp), 'PPP')}
                        </span>
                      </div>
                    )}
                    <div className={cn('flex items-end space-x-2 mb-1', {
                      'justify-end': isMe,
                      'justify-start': !isMe,
                    })}>
                      {!isMe && showAvatar && (
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <img src={otherUserProfile.profileImage || '/placeholder.svg'} alt={otherUserProfile.name} className="w-full h-full object-cover rounded-full" />
                        </Avatar>
                      )}
                      {!isMe && !showAvatar && <div className="w-6" />}
                      <div className={cn('relative max-w-[75%] px-3 py-2 rounded-lg break-words', {
                        'bg-primary text-white rounded-br-none': isMe,
                        'bg-gray-800 text-gray-100 rounded-bl-none': !isMe,
                      })}>
                        {imageMessage ? (
                          <img
                            src={(message as any).imageUrl || message.text}
                            alt="Sent image"
                            className="max-w-full h-auto rounded-md"
                          />
                        ) : (
                          <p>{message.text}</p>
                        )}
                        <div className={cn('text-[10px] leading-none mt-1 flex items-center gap-1', {
                          'justify-end text-muted-foreground': isMe,
                          'text-muted-foreground': !isMe,
                        })}>
                          {format(new Date(message.timestamp), 'p')}
                          {isMe && (
                            <span>{message.read ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Fixed input bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent z-20">
        <div className="max-w-4xl mx-auto px-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2 p-4 border-t border-gray-800 bg-gray-900 rounded-t-lg"
          >
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Set typing indicator
                const chatId = [user.id, profileId].sort().join('_');
                set(ref(database, `chats/${chatId}/typing/${user.id}`), true);

                // Clear previous timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                // Set new timeout to clear typing indicator
                typingTimeoutRef.current = setTimeout(() => {
                  set(ref(database, `chats/${chatId}/typing/${user.id}`), false);
                }, 1000);
              }}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 text-white border-none focus:ring-0 focus:outline-none"
              autoFocus
              disabled={loading}
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-transparent"
            >
              <ImageIcon className="w-5 h-5 text-gray-200" />
            </Button>
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={!newMessage.trim() || loading}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        type="message"
      />
    </div>
  );
};

export default Chat;