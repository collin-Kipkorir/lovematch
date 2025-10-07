import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useChatList } from '../hooks/useOptimizedChat';
import ChatModal from './ChatModal';
import { Chat, ChatMessage } from '../types/chat';
import { cn } from '../lib/utils';

const ChatList = () => {
  // Modal state for WhatsApp-like chat
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const { chats, loading } = useChatList();
  // Removed useProfiles; use participant data directly for chat display

  // Sort chats by last message time and unread status
  const sortedChats = useMemo(() => {
    if (!chats) return [];
    return [...chats].sort((a, b) => {
      if (!a?.metadata || !b?.metadata) return 0;
      // First sort by unread status
      const aUnread = (a.unreadCount?.[user?.id || ''] || 0) > 0;
      const bUnread = (b.unreadCount?.[user?.id || ''] || 0) > 0;
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }
      // Then sort by timestamp
      const aTimestamp = a.metadata.lastMessage?.timestamp || a.metadata.createdAt || 0;
      const bTimestamp = b.metadata.lastMessage?.timestamp || b.metadata.createdAt || 0;
      return bTimestamp - aTimestamp;
    });
  }, [chats, user?.id]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>

          </div>
        ))}
      </div>
    );
  }

  if (sortedChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4">
        <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Start chatting with your matches to find your soulmate!
        </p>
        {/* Debug output for troubleshooting */}
        <pre className="text-xs text-left bg-gray-100 rounded p-2 mt-4 w-full max-w-xl overflow-x-auto">
          {JSON.stringify(chats, null, 2)}
        </pre>
      </div>
    );
  }

  const formatMessagePreview = (content: string) => {
    return content.length > 50 ? content.substring(0, 47) + '...' : content;
  };

  return (
    <>
      <ScrollArea className="h-[calc(100vh-12rem)] md:h-[70vh]">
        <div className="space-y-2">
          {sortedChats
            .filter((chat) => {
              if (!user?.id) return false;
              // Exclude if all participants are the current user
              if (chat.participants.every(p => p.userId === user.id)) return false;
              // Exclude if there are only two participants and both are the current user (data anomaly)
              if (chat.participants.length === 2 && chat.participants.filter(p => p.userId === user.id).length === 2) return false;
              // Exclude if the only other participant is the current user
              const otherParticipants = chat.participants.filter(p => p.userId !== user.id);
              if (otherParticipants.length === 0) return false;
              // Exclude if the other participant's id is missing or matches the user
              if (otherParticipants.length === 1 && (!otherParticipants[0].userId || otherParticipants[0].userId === user.id)) return false;
              return true;
            })
            .map((chat) => {
              const lastMessage = chat.metadata.lastMessage;
              // Find the other participant (not the current user)
              const otherParticipant = chat.participants.find(p => p.userId !== user?.id);
              // Fallback: if not found, use the first participant that is not the current user, or the first participant
              const fallbackParticipant = chat.participants.find(p => p.userId && p.userId !== user?.id) || chat.participants[0];
              // Use the participant data directly from the chat node
              let receiver = chat.participants.find(p => p.userId && p.userId !== user?.id);
              if (!receiver) {
                receiver = chat.participants[0];
              }
              // Compose display name and avatar with robust fallback
              const displayName = receiver?.name || 'User';
              let displayAvatar = receiver?.profileImage || receiver?.avatar;
              if (!displayAvatar || typeof displayAvatar !== 'string' || displayAvatar.trim() === '' || displayAvatar === 'undefined' || displayAvatar === 'null') {
                displayAvatar = '';
              } else if (!displayAvatar.startsWith('http') && !displayAvatar.startsWith('data:')) {
                // If it's a relative path, ensure it starts with /
                displayAvatar = displayAvatar.startsWith('/') ? displayAvatar : `/${displayAvatar}`;
              }

              // Always show a preview of the most recent sent or received message
              let messagePreview = 'No messages yet';
              if (lastMessage && lastMessage.content) {
                if (lastMessage.senderId === user?.id) {
                  messagePreview = `You: ${formatMessagePreview(lastMessage.content)}`;
                } else {
                  messagePreview = formatMessagePreview(lastMessage.content);
                }
              }
              const unreadCount = chat.unreadCount?.[user?.id || ''] || 0;
              const isLastMessageFromMe = lastMessage?.senderId === user?.id;
              const timestamp = Number(chat.metadata.lastMessage?.timestamp || chat.metadata.updatedAt || chat.metadata.createdAt || Date.now());
              const lastMessageTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

          
              return (
                <div key={chat.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full py-8 px-1 mb-2 flex items-center rounded-lg border border-gray-200 shadow-sm transition-all bg-gray-900 hover:bg-gray-800 focus:bg-gray-800",
                      unreadCount > 0 && !isLastMessageFromMe ? "bg-accent/20 border-accent/40" : ""
                    )}
                    onClick={() => {
                      setSelectedUserId(otherParticipant?.userId || fallbackParticipant?.userId || null);
                      setModalOpen(true);
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={displayAvatar}
                            alt={displayName}
                          />
                          <AvatarFallback>
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center w-full">
                          <h3 className="font-semibold text-base truncate text-white">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {lastMessageTime}
                            </span>
                            {unreadCount > 0 && !isLastMessageFromMe && (
                              <Badge
                                variant="destructive"
                                className="w-6 h-6 flex items-center justify-center p-0 text-xs rounded-full shadow-md border-2 border-white"
                              >
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                          <div className={cn("text-sm truncate flex items-center", {
                            "font-medium text-gray-200": unreadCount > 0 && !isLastMessageFromMe,
                            "text-gray-400": !unreadCount || isLastMessageFromMe
                          })}>
                            <span>{messagePreview}</span>
                          </div>
                      </div>
                    </div>
                  </Button>
                </div>
              );
            })}
        </div>
      </ScrollArea>
      <ChatModal open={modalOpen} onOpenChange={setModalOpen} otherUserId={selectedUserId} />
    </>
  );
};

export default ChatList;