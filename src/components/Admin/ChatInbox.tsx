/* 
 * ChatInbox Component
 * 
 * BACKEND INTEGRATION REQUIREMENTS:
 * 
 * 1. API Endpoints needed:
 *    - GET /api/moderator/conversations - Fetch conversations with pagination and filters
 *    - GET /api/moderator/conversations/{id}/messages - Fetch messages for a conversation
 *    - POST /api/moderator/conversations/{id}/messages - Send new message as dummy profile
 *    - PUT /api/moderator/conversations/{id}/assign - Assign conversation to moderator
 *    - PUT /api/moderator/conversations/{id}/flag - Flag conversation for review
 *    - PUT /api/moderator/conversations/{id}/status - Update conversation status
 *    - GET /api/moderator/quick-replies - Fetch pre-defined response templates
 * 
 * 2. Database Schema needed:
 *    - conversations: id, real_user_id, dummy_profile_id, status, assigned_moderator_id, created_at
 *    - messages: id, conversation_id, sender_type, content, timestamp, status, moderator_id
 *    - quick_replies: id, category, content, usage_count, created_at
 *    - conversation_assignments: id, conversation_id, moderator_id, assigned_at
 * 
 * 3. Real-time features:
 *    - WebSocket connection for live message updates
 *    - Real-time notification system for new messages
 *    - Typing indicators for better user experience
 *    - Message read receipts
 * 
 * 4. Moderation features:
 *    - Automated content filtering
 *    - Escalation system for inappropriate content
 *    - Conversation history tracking
 *    - Performance metrics for moderators
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Send, Flag, User, Bot, Clock } from 'lucide-react';
import { adminResponses } from '@/data/dummyProfiles';
import { dummyChatConversations } from '@/data/adminData';

// TODO: Backend Integration - Replace with API call
// GET /api/moderator/conversations with filters and pagination
const initialConversations = [
  {
    id: 'conv-1',                    // TODO: UUID from database
    realUserId: '1',                 // TODO: Foreign key to users table
    realUserName: 'John Smith',      // TODO: Fetch from users.name
    dummyProfileId: 'dummy-1',       // TODO: Foreign key to dummy_profiles table
    dummyProfileName: 'Emma Rose',   // TODO: Fetch from dummy_profiles.name
    dummyProfileAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', // TODO: dummy_profiles.avatar_url
    lastMessage: 'Would love to go hiking this weekend!', // TODO: Latest message content
    lastMessageTime: '2024-07-30T14:30:00Z',              // TODO: Latest message timestamp
    unreadCount: 2,                  // TODO: Count unread messages for moderator
    assignedAdminId: 'admin-2',      // TODO: Foreign key to moderators table
    status: 'assigned' as 'open' | 'assigned' | 'flagged' | 'closed', // TODO: Enum in database
    messages: [
      {
        id: 'msg-1',                 // TODO: UUID from messages table
        fromUser: true,              // TODO: sender_type: 'user' | 'dummy_profile'
        content: 'Hi Emma! I love your hiking photos', // TODO: message content
        timestamp: '2024-07-30T14:00:00Z',            // TODO: message timestamp
        status: 'read'               // TODO: message status: sent, delivered, read
      },
      {
        id: 'msg-2',
        fromUser: false,             // TODO: Message from dummy profile (moderator response)
        content: 'Thank you! Do you enjoy hiking too?',
        timestamp: '2024-07-30T14:15:00Z',
        status: 'read',
        adminId: 'admin-2'           // TODO: Track which moderator sent the message
      },
      {
        id: 'msg-3',
        fromUser: true,
        content: 'Yes! Would love to go hiking this weekend!',
        timestamp: '2024-07-30T14:30:00Z',
        status: 'delivered'
      }
    ]
  },
  {
    id: 'conv-2',
    realUserId: '2',
    realUserName: 'Sarah Wilson',
    dummyProfileId: 'dummy-2',
    dummyProfileName: 'Alex Thompson',
    dummyProfileAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    lastMessage: 'That sounds really interesting!',
    lastMessageTime: '2024-07-30T13:45:00Z',
    unreadCount: 1,
    assignedAdminId: null,           // TODO: null means unassigned
    status: 'open' as 'open' | 'assigned' | 'flagged' | 'closed',
    messages: [
      {
        id: 'msg-4',
        fromUser: true,
        content: 'Hi Alex! I saw you work in tech. What kind of projects do you work on?',
        timestamp: '2024-07-30T13:30:00Z',
        status: 'read'
      },
      {
        id: 'msg-5',
        fromUser: false,
        content: 'That sounds really interesting!',
        timestamp: '2024-07-30T13:45:00Z',
        status: 'delivered'
      }
    ]
  }
];

const ChatInbox: React.FC = () => {
  // TODO: Backend Integration - Replace with API calls and real-time updates
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  // Quick reply templates removed as requested
  // const [quickReplyTemplate, setQuickReplyTemplate] = useState('');
  
  // TODO: Add loading states for API calls
  // const [loading, setLoading] = useState(false);
  // const [fetchingMessages, setFetchingMessages] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message = {
      id: `msg-${Date.now()}`,
      fromUser: false,
      content: newMessage,
      timestamp: new Date().toISOString(),
      status: 'sent' as const,
      adminId: 'current-admin'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0
        };
      }
      return conv;
    }));

    setSelectedConversation((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message]
    }));

    setNewMessage('');
    toast({
      title: "Message Sent",
      description: "Your reply has been sent to the user",
    });
  };

  // Quick reply functionality removed as requested
  // const handleQuickReply = (template: string) => {
  //   setNewMessage(template);
  // };

  const handleFlagConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, status: 'flagged' as const };
      }
      return conv;
    }));

    toast({
      title: "Conversation Flagged",
      description: "This conversation has been flagged for review",
      variant: "destructive"
    });
  };

  const handleAssignConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { 
          ...conv, 
          status: 'assigned' as const,
          assignedAdminId: 'current-admin'
        };
      }
      return conv;
    }));

    toast({
      title: "Conversation Assigned",
      description: "You are now assigned to this conversation",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openConversations = conversations.filter(conv => conv.status === 'open');
  const assignedConversations = conversations.filter(conv => conv.status === 'assigned');
  const flaggedConversations = conversations.filter(conv => conv.status === 'flagged');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chat Inbox</h2>
        <p className="text-muted-foreground">
          Manage conversations between real users and dummy profiles
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="all" className="text-xs md:text-sm">
            All ({conversations.length})
          </TabsTrigger>
          <TabsTrigger value="open" className="text-xs md:text-sm">
            Open ({openConversations.length})
          </TabsTrigger>
          <TabsTrigger value="assigned" className="text-xs md:text-sm">
            Assigned ({assignedConversations.length})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="text-xs md:text-sm">
            Flagged ({flaggedConversations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <Card key={conversation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex -space-x-2 flex-shrink-0">
                        <Avatar className="border-2 border-background h-8 w-8 md:h-10 md:w-10">
                          <AvatarFallback>
                            <User className="h-3 w-3 md:h-4 md:w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background h-8 w-8 md:h-10 md:w-10">
                          <AvatarImage src={conversation.dummyProfileAvatar} />
                          <AvatarFallback>
                            <Bot className="h-3 w-3 md:h-4 md:w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
                          <h3 className="font-medium text-foreground text-sm md:text-base truncate">
                            <span className="hidden md:inline">{conversation.realUserName} ↔ {conversation.dummyProfileName}</span>
                            <span className="md:hidden">{conversation.realUserName.split(' ')[0]} ↔ {conversation.dummyProfileName.split(' ')[0]}</span>
                          </h3>
                          <div className="flex items-center space-x-1 flex-wrap">
                            <Badge className={`${getStatusColor(conversation.status)} text-xs`}>
                              {conversation.status}
                            </Badge>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount} new
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            <span className="hidden md:inline">{formatDate(conversation.lastMessageTime)} at {formatTime(conversation.lastMessageTime)}</span>
                            <span className="md:hidden">{formatTime(conversation.lastMessageTime)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 md:flex-nowrap md:space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs flex-1 md:flex-none"
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                            <span className="hidden md:inline">Reply</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] mx-4 md:mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-sm md:text-base">
                              <span className="hidden md:inline">Chat: {conversation.realUserName} ↔ {conversation.dummyProfileName}</span>
                              <span className="md:hidden">{conversation.realUserName.split(' ')[0]} ↔ {conversation.dummyProfileName.split(' ')[0]}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs md:text-sm">
                              Respond as {conversation.dummyProfileName}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="flex flex-col h-[50vh] md:h-[60vh]">
                            <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 p-2 md:p-4 bg-muted/20 rounded-lg">
                              {conversation.messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.fromUser ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[85%] md:max-w-[70%] p-2 md:p-3 rounded-lg ${
                                      message.fromUser
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card border border-border'
                                    }`}
                                  >
                                    <p className="text-xs md:text-sm break-words">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                      {formatTime(message.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-2 md:mt-4 space-y-3 md:space-y-4">
                              {/* TODO: Backend Integration - Remove quick templates as requested */}
                              
                              <div className="flex space-x-2">
                                <Input
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                />
                                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm">
                                  <Send className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {conversation.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1 md:flex-none"
                          onClick={() => handleAssignConversation(conversation.id)}
                        >
                          <span className="hidden md:inline">Assign to Me</span>
                          <span className="md:hidden">Assign</span>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive text-xs flex-1 md:flex-none"
                        onClick={() => handleFlagConversation(conversation.id)}
                      >
                        <Flag className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="ml-1 md:hidden">Flag</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Open Conversations</CardTitle>
              <CardDescription>Unassigned conversations that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {openConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        <Avatar className="border-2 border-background">
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background">
                          <AvatarImage src={conversation.dummyProfileAvatar} />
                          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium">{conversation.realUserName} ↔ {conversation.dummyProfileName}</p>
                        <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAssignConversation(conversation.id)}>
                      Assign to Me
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Conversations</CardTitle>
              <CardDescription>Conversations assigned to admins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        <Avatar className="border-2 border-background">
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background">
                          <AvatarImage src={conversation.dummyProfileAvatar} />
                          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium">{conversation.realUserName} ↔ {conversation.dummyProfileName}</p>
                        <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                      </div>
                    </div>
                    <Badge variant="default">Assigned</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Conversations</CardTitle>
              <CardDescription>Conversations that require immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-2">
                        <Avatar className="border-2 border-background">
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background">
                          <AvatarImage src={conversation.dummyProfileAvatar} />
                          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium">{conversation.realUserName} ↔ {conversation.dummyProfileName}</p>
                        <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Flagged</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatInbox;