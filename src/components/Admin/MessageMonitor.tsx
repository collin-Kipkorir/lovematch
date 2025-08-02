import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Trash2, MessageSquare, Search, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ChatReplyModal from './ChatReplyModal';

const dummyMessages = [
  { id: '1', from: 'John Doe', to: 'Sarah Smith', content: 'Hey! How are you doing?', timestamp: '2024-07-29 14:30', status: 'delivered' },
  { id: '2', from: 'Sarah Smith', to: 'John Doe', content: 'Hi John! I\'m doing great, thanks for asking!', timestamp: '2024-07-29 14:35', status: 'read' },
  { id: '3', from: 'Mike Johnson', to: 'Emily Brown', content: 'Would you like to grab coffee sometime?', timestamp: '2024-07-29 13:15', status: 'delivered' },
  { id: '4', from: 'Emily Brown', to: 'Mike Johnson', content: 'That sounds lovely! When were you thinking?', timestamp: '2024-07-29 13:45', status: 'read' },
  { id: '5', from: 'Alex Rivera', to: 'Jordan Kim', content: 'Your profile caught my eye! Love your travel photos.', timestamp: '2024-07-29 12:20', status: 'delivered' },
  { id: '6', from: 'Jordan Kim', to: 'Alex Rivera', content: 'Thank you! I see you\'re into hiking too. Any favorite trails?', timestamp: '2024-07-29 12:45', status: 'read' },
];

// Group messages into conversations
const groupMessagesIntoConversations = (messages: any[]) => {
  const conversations: any = {};
  
  messages.forEach(message => {
    const participants = [message.from, message.to].sort();
    const key = participants.join('-');
    
    if (!conversations[key]) {
      conversations[key] = {
        id: key,
        participants,
        messages: [],
        lastMessage: message,
        unreadCount: 0
      };
    }
    
    conversations[key].messages.push(message);
    if (message.timestamp > conversations[key].lastMessage.timestamp) {
      conversations[key].lastMessage = message;
    }
    if (message.status === 'delivered') {
      conversations[key].unreadCount++;
    }
  });
  
  return Object.values(conversations);
};

const MessageMonitor: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [viewThreadConversation, setViewThreadConversation] = useState<any>(null);
  const [isViewThreadOpen, setIsViewThreadOpen] = useState(false);

  const conversations = groupMessagesIntoConversations(dummyMessages);

  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = conv.participants.some((p: string) => 
      p.toLowerCase().includes(searchTerm.toLowerCase())
    ) || conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unread' && conv.unreadCount > 0) ||
      (statusFilter === 'read' && conv.unreadCount === 0);
    
    return matchesSearch && matchesStatus;
  });

  const handleReplyAsProfile = (conversation: any) => {
    setSelectedConversation(conversation);
    setIsReplyModalOpen(true);
  };

  const handleViewFullThread = (conversation: any) => {
    setViewThreadConversation(conversation);
    setIsViewThreadOpen(true);
  };

  const handleDeleteConversation = (conversationId: string) => {
    toast({
      title: "Conversation Deleted",
      description: "The conversation has been removed",
    });
  };

  return (
    <>
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Message Monitoring</CardTitle>
          <CardDescription>Monitor conversations and reply as any profile</CardDescription>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredConversations.map((conversation: any) => (
              <div key={conversation.id} className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{conversation.participants[0]}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="font-medium text-foreground">{conversation.participants[1]}</span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{conversation.lastMessage.timestamp}</span>
                </div>
                
                <div className="mb-3 p-3 bg-muted rounded border-l-4 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Latest message from {conversation.lastMessage.from}:</p>
                  <p className="text-foreground">{conversation.lastMessage.content}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleReplyAsProfile(conversation)}
                    className="flex items-center space-x-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Reply as Profile</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewFullThread(conversation)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Full Thread
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteConversation(conversation.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ChatReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        conversation={selectedConversation}
      />

      {/* Full Thread View Modal */}
      <Dialog open={isViewThreadOpen} onOpenChange={setIsViewThreadOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Full Conversation Thread</DialogTitle>
            <DialogDescription>
              {viewThreadConversation && `Complete conversation between ${viewThreadConversation.participants.join(' and ')}`}
            </DialogDescription>
          </DialogHeader>
          
          {viewThreadConversation && (
            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {viewThreadConversation.messages.map((message: any) => (
                    <div key={message.id} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={message.from === viewThreadConversation.participants[0] ? "default" : "secondary"}>
                            {message.from}
                          </Badge>
                          <span className="text-xs text-muted-foreground">to {message.to}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.from === viewThreadConversation.participants[0] 
                          ? 'bg-primary text-primary-foreground ml-8' 
                          : 'bg-muted mr-8'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="mt-1 flex justify-end">
                          <Badge variant="outline" className="text-xs">
                            {message.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewThreadOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewThreadOpen(false);
                  handleReplyAsProfile(viewThreadConversation);
                }}>
                  Reply to Conversation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageMonitor;