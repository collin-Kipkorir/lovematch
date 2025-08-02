import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import { MessageCircle, Search, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

/**
 * CHATS PAGE - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace mock conversations with real chat data
 * 
 * DATABASE SCHEMA:
 * Table: conversations
 * - id (uuid, primary key)
 * - participant_1 (uuid, foreign key to auth.users)
 * - participant_2 (uuid, foreign key to auth.users)
 * - created_at (timestamp)
 * - last_message_at (timestamp)
 * - is_active (boolean)
 * 
 * Table: messages
 * - id (uuid, primary key)
 * - conversation_id (uuid, foreign key)
 * - sender_id (uuid, foreign key to auth.users)
 * - content (text)
 * - message_type ('text', 'image', 'video', 'audio', 'system')
 * - is_read (boolean)
 * - created_at (timestamp)
 * - edited_at (timestamp, nullable)
 * 
 * REAL-TIME MESSAGING:
 * - Use Supabase Realtime for instant messaging
 * - Listen to new messages: supabase.channel('messages').on('postgres_changes'...)
 * - Update unread count in real-time
 * - Show typing indicators
 * - Online/offline status
 * 
 * SEARCH FUNCTIONALITY:
 * - Search by participant name
 * - Search within message content
 * - Filter by conversation type
 * - Search with pagination
 * 
 * FEATURES TO IMPLEMENT:
 * - Message reactions/emojis
 * - Message delivery/read receipts
 * - File/image sharing
 * - Video call integration
 * - Message encryption
 * - Block/report functionality
 * - Archive conversations
 * 
 * CREDIT SYSTEM INTEGRATION:
 * - Deduct credits per message sent
 * - Premium features for verified users
 * - Video message credits tracking
 */

const Chats: React.FC = () => {
  const { user, chatConversations, deleteChatConversation } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleChatClick = (chat: any) => {
    navigate(`/chat/${chat.profileId}`);
  };

  /**
   * DELETE CHAT FUNCTIONALITY
   * TODO: Backend Integration - Replace with API call
   * 
   * API Endpoint: DELETE /api/conversations/{conversationId}
   * Features: Soft deletion, audit trail, real-time updates
   */
  const handleDeleteChat = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat click
    
    if (window.confirm(`Delete conversation with ${chat.name}? This action cannot be undone.`)) {
      deleteChatConversation(chat.profileId);
      toast({
        title: "Chat Deleted",
        description: `Conversation with ${chat.name} has been deleted.`,
      });
    }
  };

  /**
   * SEARCH FUNCTIONALITY
   * TODO: Backend Integration - Replace with API search
   * 
   * API Endpoint: GET /api/conversations/search?q={query}
   * Features: Full-text search, message content search, participant search
   */
  const filteredChats = chatConversations.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Chats</h1>
          
          {/* Enhanced Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Enhanced Chat List with Delete Functionality */}
          <div className="space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try searching with different keywords'
                    : 'Start a conversation by messaging someone\'s profile!'
                  }
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg cursor-pointer transition-colors group"
                >
                  <div 
                    className="flex items-center space-x-3 flex-1 min-w-0"
                    onClick={() => handleChatClick(chat)}
                  >
                    <div className="relative">
                      {chat.profilePicture ? (
                        <img
                          src={chat.profilePicture}
                          alt={chat.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-primary flex items-center justify-center text-lg sm:text-xl">
                          {chat.avatar}
                        </div>
                      )}
                      {chat.unread > 0 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chat.unread > 9 ? '9+' : chat.unread}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate text-sm sm:text-base">{chat.name}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{chat.timestamp}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>

                  {/* Delete button - visible on hover or mobile */}
                  <div className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteChat(chat, e)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chats;