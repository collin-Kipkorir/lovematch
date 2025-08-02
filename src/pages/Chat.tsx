import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dummyProfiles, adminResponses } from '@/data/dummyProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';
import PaymentModal from '@/components/PaymentModal';

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

interface Message {
  id: string;
  sender: 'user' | 'match';
  content: string;
  timestamp: Date;
}

const Chat: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const { user, updateCredits, deleteChatConversation } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const profile = dummyProfiles.find(p => p.id === profileId);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!profile) {
      navigate('/');
      return;
    }

    // Load existing messages from localStorage
    const savedMessages = localStorage.getItem(`chat_${profileId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
    } else {
      // Start conversation with a greeting
      const greeting: Message = {
        id: '1',
        sender: 'match',
        content: `Hi ${user.name}! Thanks for reaching out. I'd love to get to know you better!`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [user, profile, profileId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user || !profile) return;

    if (user.credits <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');
    updateCredits(-1);

    // Simulate response from "match" (actually admin)
    setTimeout(() => {
      const response = adminResponses[Math.floor(Math.random() * adminResponses.length)];
      const matchMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'match',
        content: response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, matchMessage];
      setMessages(finalMessages);
      
      // Save to localStorage
      localStorage.setItem(`chat_${profileId}`, JSON.stringify(finalMessages));
    }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
  };

  /**
   * DELETE CHAT FUNCTIONALITY
   * TODO: Backend Integration - Replace with API call
   * 
   * API Endpoint: DELETE /api/conversations/{conversationId}
   * - Soft delete: Mark conversation as deleted for current user
   * - Keep messages for other participant and admin audit
   * - Remove from user's conversation list
   * - Update real-time listeners
   */
  const handleDeleteChat = () => {
    if (!profileId || !profile) return;
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete this conversation with ${profile.name}? This action cannot be undone.`)) {
      deleteChatConversation(profileId);
      localStorage.removeItem(`chat_${profileId}`);
      
      toast({
        title: "Chat Deleted",
        description: `Conversation with ${profile.name} has been deleted.`,
      });
      
      navigate('/chats');
    }
  };

  if (!profile || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profiles</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteChat}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Chat
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-card shadow-romantic">
          <CardHeader className="border-b bg-gradient-primary text-primary-foreground">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{profile.avatar}</div>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-sm opacity-90">{profile.age} years old</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage}
                  className="bg-gradient-primary shadow-romantic"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground text-center">
                {user.credits} credits remaining
              </div>
            </div>
          </CardContent>
        </Card>
        
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type="message"
        />
      </div>
    </div>
  );
};

export default Chat;