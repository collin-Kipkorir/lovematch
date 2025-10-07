import React, { useEffect, useRef, useState } from 'react';

// ErrorBoundary must be defined outside the function component
type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error: any };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Optionally log error info
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-100 rounded">
          <strong>Something went wrong in ChatConversation:</strong>
          <pre className="whitespace-pre-wrap text-xs mt-2">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { ref, get, runTransaction } from 'firebase/database';
import { database } from '../lib/firebase';
import PaymentModal from './PaymentModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOptimizedChat } from '../hooks/useOptimizedChat';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { ArrowLeft, Send, Trash2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatConversationProps {
  otherUserId?: string;
  onBack?: () => void;
}

interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: number;
  read?: boolean;
  imageUrl?: string;
  message_type?: 'text' | 'image';
}

interface ChatParticipant {
  userId?: string;
  name?: string;
  profileImage?: string;
  avatar?: string;
  images?: string[];
  age?: number;
  [key: string]: unknown;
}

const ChatConversationInner: React.FC<ChatConversationProps> = ({ otherUserId: propOtherUserId, onBack }) => {
  const { otherUserId: routeOtherUserId } = useParams<{ otherUserId: string }>();
  const otherUserId = propOtherUserId || routeOtherUserId;
  const navigate = useNavigate();
  const { user, deleteChatConversation } = useAuth();
  const { toast } = useToast();
  const { messages, loading, sendMessage } = useOptimizedChat(otherUserId);
  const [newMessage, setNewMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Fetch other participant info from chat node
  const [otherUser, setOtherUser] = useState<ChatParticipant | null>(null);
  const getOtherUserName = (ou: ChatParticipant | null) => {
    if (!ou) return 'the user';
    if (ou.name && typeof ou.name === 'string') return ou.name;
    return 'the user';
  };

  // Robust age extractor: supports numeric age, numeric string, and birthdate fields
  const getOtherUserAge = (ou: ChatParticipant | null): number | null => {
    if (!ou) return null;
    const maybe = ou as Record<string, unknown>;
    const a = maybe.age;
    if (typeof a === 'number' && !Number.isNaN(a)) return a;
    if (typeof a === 'string' && a.trim() !== '') {
      const n = Number(a);
      if (!Number.isNaN(n)) return n;
    }

    // check common birthdate fields and compute age
    const dobFields = ['dob', 'dateOfBirth', 'birthDate', 'birthday'];
    for (const field of dobFields) {
      const val = maybe[field];
      if (!val) continue;
      const s = typeof val === 'string' ? val : String(val);
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years -= 1;
        if (years >= 0) return years;
      }
    }

    return null;
  };
  useEffect(() => {
    if (!otherUserId) return;
    // Find the chat node and get the participant info
    const chatId = user && otherUserId ? [user.id, otherUserId].sort().join('_') : null;
    if (!chatId) return;
    const chatRef = ref(database, `chats/${chatId}`);
    get(chatRef).then((snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.val();
        if (chatData && chatData.participants && chatData.participants[otherUserId]) {
          const raw = chatData.participants[otherUserId] as Record<string, unknown>;
          const normalized: Record<string, unknown> = { ...raw };
          // Normalize age to number if possible
          if ('age' in raw) {
            const a = raw.age;
            const n = typeof a === 'number' ? a : (typeof a === 'string' && a !== '' ? Number(a) : NaN);
            if (!Number.isNaN(n)) normalized.age = n;
            else delete normalized.age;
          }
          // Prefer profileImage, fall back to avatar or first image
          if (!('profileImage' in normalized)) {
            if ('avatar' in raw && typeof raw.avatar === 'string') normalized.profileImage = raw.avatar;
            else if ('images' in raw && Array.isArray(raw.images)) {
              const imgs = raw.images as unknown[];
              if (imgs.length > 0 && typeof imgs[0] === 'string') normalized.profileImage = imgs[0] as string;
            }
          }

          // Also try to read authoritative user record and merge available fields (name, age, profileImage)
          const userRef = ref(database, `users/${otherUserId}`);
          get(userRef).then((userSnap) => {
            if (userSnap.exists()) {
              const userRaw = userSnap.val() as Record<string, unknown>;
              if (userRaw.name && typeof userRaw.name === 'string') normalized.name = userRaw.name;
              if (userRaw.profileImage && typeof userRaw.profileImage === 'string') normalized.profileImage = userRaw.profileImage;
              if (userRaw.age !== undefined) {
                const ua = userRaw.age;
                const un = typeof ua === 'number' ? ua : (typeof ua === 'string' && ua !== '' ? Number(ua) : NaN);
                if (!Number.isNaN(un)) normalized.age = un;
              }
            }

            setOtherUser({
              userId: otherUserId,
              ...(normalized as ChatParticipant),
            });
          }).catch(() => {
            // If reading user fails, fallback to participant data
            setOtherUser({
              userId: otherUserId,
              ...(normalized as ChatParticipant),
            });
          });
        } else {
          setOtherUser(null);
        }
      } else {
        setOtherUser(null);
      }
    });
  }, [user, otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id) return;

    // Check if user has enough credits
    if (user.credits <= 0) {
      setShowPaymentModal(true);
      return;
    }
    
    // Store current credit amount for rollback if needed
    const previousCredits = user.credits;

    try {
      // Send message first
      await sendMessage(newMessage.trim());

      // If message sent successfully, deduct credit
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !otherUserId) {
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

    // Check if user has enough credits
    if (user.credits <= 0) {
      setShowPaymentModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Store current credit amount for rollback if needed
    const previousCredits = user.credits;

    try {
      const chatId = [user.id, otherUserId].sort().join('_');
      const storage = getStorage();
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const imgRef = storageRef(storage, `chat_images/${chatId}/${safeName}`);

      await uploadBytes(imgRef, file);
      const downloadUrl = await getDownloadURL(imgRef);

      // Send message first
      await sendMessage({ text: downloadUrl, imageUrl: downloadUrl, message_type: 'image' } as Message);

      // If message sent successfully, deduct credit
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
    } catch (error) {
      console.error('Error uploading/sending image:', error);
      toast({
        title: "Error",
        description: "Failed to send image. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isLikelyImage = (message: Message) => {
    if (message.message_type === 'image') return true;
    if (message.imageUrl) return true;
    if (typeof message.text === 'string') {
      if (message.text.startsWith('data:')) return true;
      if (/https?:\/\/.*\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(message.text)) return true;
    }
    return false;
  };

  if (!user) return null;

  
  return (
  <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-900 text-white">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type="message"
        onSuccess={() => {
          setShowPaymentModal(false);
          // Try sending the pending message again after successful payment
          if (newMessage.trim()) {
            handleSend(new Event('submit') as React.FormEvent);
          } else if (fileInputRef.current?.files?.length) {
            // If there's a pending image upload
            handleImageSelect({ target: { files: fileInputRef.current.files } } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
      />
      {/* Fixed Chat Header */}
      <div className="fixed  left-0 right-0 z-30">
        <div className="flex items-center border-b bg-gray-800 shadow-sm px-4 py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center w-full">
            <Button variant="ghost" size="icon" className="mr-2" onClick={onBack || (() => navigate('/'))}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="w-10 h-10 mr-3">
              <img
                src={otherUser?.profileImage || '/placeholder.svg'}
                alt={otherUser?.name || 'User'}
                className="w-full h-full object-cover rounded-full"
              />
            </Avatar>
            <div className="flex flex-col flex-1">
              <h2 className="font-semibold">{otherUser?.name || 'User'}</h2>
              {(() => {
                const age = getOtherUserAge(otherUser);
                if (age !== null) return <span className="text-xs text-muted-foreground">{age} years old</span>;
                return null;
              })()}
            </div>
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Conversation</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Are you sure you want to delete this conversation with {getOtherUserName(otherUser)}? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        if (!otherUserId || !deleteChatConversation || !otherUser) return;
                        
                        deleteChatConversation(otherUserId);
                        try { 
                          localStorage.removeItem(`chat_${otherUserId}`); 
                        } catch (e) { 
                          console.warn('Failed to remove local chat cache', e); 
                        }
                        
                        toast({
                          title: "Chat Deleted",
                          description: `Conversation with ${getOtherUserName(otherUser)} has been deleted.`,
                          variant: "default",
                          action: (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/chats')}
                              className="bg-transparent border-white text-white hover:bg-white/10"
                            >
                              View Chats
                            </Button>
                          ),
                        });
                        
                        navigate('/chats');
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
  <ScrollArea className="flex-1 px-4 py-2 bg-gray-900 pb-28 pt-20">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 ">
                <p className="text-lg font-semibold">Start a Conversation</p>
                <p className="text-sm text-muted-foreground">
                  Say hello to start chatting!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message, index) => {
                  const isMe = message.senderId === user.id;
                  const showAvatar = !isMe && (!messages[index - 1] || messages[index - 1].senderId !== message.senderId);
                  const showTimestamp = !messages[index + 1] || new Date(messages[index + 1].timestamp).getDate() !== new Date(message.timestamp).getDate();
                  return (
                    <div key={message.id || index}>
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
                            <img
                              src={otherUser ? (otherUser.profileImage || otherUser.avatar || otherUser.images?.[0]) : '/placeholder.svg'}
                              alt={otherUser ? (otherUser.name || 'User') : 'User'}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </Avatar>
                        )}
                        {!isMe && !showAvatar && <div className="w-6" />}
                        <div className={cn('relative max-w-[75%] px-3 py-2 rounded-lg break-words', {
                          'bg-primary text-white rounded-br-none': isMe,
                          'bg-gray-800 text-gray-100 rounded-bl-none': !isMe,
                        })}>
                          {isLikelyImage(message) ? (
    <img
      src={message.imageUrl || message.text}
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
         
          </>
        )}
      </ScrollArea>
      {/* Fixed input bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent z-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            title="Upload image"
            aria-label="Upload image"
          />
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 p-4 border-t border-gray-800 bg-gray-900 rounded-t-lg"
          >
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
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
            <Button type="submit" disabled={loading || !newMessage.trim()} size="icon" className="bg-primary text-white">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatConversationInner;