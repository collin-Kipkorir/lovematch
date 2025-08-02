import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, MessageSquare, Search, Filter, User, Plus, Users, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dummyAdmins, dummyChatConversations } from '@/data/adminData';
import { dummyProfiles } from '@/data/dummyProfiles';
import { useIsMobile } from '@/hooks/use-mobile';

// Real users who are online or recently online
const dummyOnlineUsers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', lastActive: '2 min ago', status: 'online', credits: 45 },
  { id: '2', name: 'Mike Chen', email: 'mike@example.com', lastActive: '5 min ago', status: 'online', credits: 32 },
  { id: '3', name: 'Lisa Brown', email: 'lisa@example.com', lastActive: '1 min ago', status: 'online', credits: 67 },
  { id: '4', name: 'David Wilson', email: 'david@example.com', lastActive: '3 min ago', status: 'online', credits: 28 },
  { id: '5', name: 'Emma Davis', email: 'emma@example.com', lastActive: '7 min ago', status: 'recently_online', credits: 54 },
  { id: '6', name: 'Alex Rivera', email: 'alex@example.com', lastActive: '12 min ago', status: 'recently_online', credits: 41 },
  { id: '7', name: 'Jordan Kim', email: 'jordan@example.com', lastActive: '15 min ago', status: 'recently_online', credits: 36 },
  { id: '8', name: 'Taylor Swift', email: 'taylor@example.com', lastActive: '18 min ago', status: 'recently_online', credits: 72 },
];

const ChatMonitor: React.FC = () => {
  const isMobile = useIsMobile();
  const [selectedModerator, setSelectedModerator] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isViewThreadOpen, setIsViewThreadOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Filter conversations by moderator assignment
  const getConversationsForModerator = (moderatorId: string) => {
    if (moderatorId === 'all') return dummyChatConversations;
    return dummyChatConversations.filter(conv => conv.assignedAdminId === moderatorId);
  };

  const filteredConversations = getConversationsForModerator(selectedModerator).filter(conv => {
    const matchesSearch = conv.realUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.dummyProfileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get moderator stats for each moderator
  const getModeratorStats = () => {
    return dummyAdmins
      .filter(admin => admin.role === 'moderator')
      .map(moderator => {
        const assignedChats = dummyChatConversations.filter(conv => conv.assignedAdminId === moderator.id);
        const activeChats = assignedChats.filter(conv => conv.status === 'assigned').length;
        const flaggedChats = assignedChats.filter(conv => conv.status === 'flagged').length;
        
        return {
          ...moderator,
          totalChats: assignedChats.length,
          activeChats,
          flaggedChats,
          messagesHandled: assignedChats.reduce((sum, conv) => sum + conv.messages.length, 0)
        };
      });
  };

  const handleViewConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    setIsViewThreadOpen(true);
  };

  const handleReassignChat = (conversationId: string, newModeratorId: string) => {
    // TODO: Backend implementation
    // This would update the conversation's assignedAdminId
    toast({
      title: "Chat Reassigned",
      description: "The conversation has been reassigned to another moderator",
    });
  };

  const handleInitiateChat = (user: any) => {
    setSelectedUser(user);
    setIsNewChatOpen(true);
  };

  const handleSendNewMessage = () => {
    if (!selectedUser || !selectedProfile || !newMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a profile and enter a message",
        variant: "destructive",
      });
      return;
    }

    // TODO: Backend implementation to create new conversation
    toast({
      title: "Message Sent",
      description: `New conversation initiated with ${selectedUser.name} as ${selectedProfile}`,
    });

    setIsNewChatOpen(false);
    setSelectedUser(null);
    setSelectedProfile('');
    setNewMessage('');
  };

  const moderatorStats = getModeratorStats();

  return (
    <div className={`space-y-6 ${isMobile ? 'p-2' : 'p-6'} min-h-screen`}>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chat Monitoring</h2>
        <p className="text-muted-foreground">
          Monitor chat activity across all moderators
        </p>
      </div>

      {/* Moderator Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {moderatorStats.map((moderator) => (
          <Card key={moderator.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {moderator.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{moderator.name}</p>
                  <p className="text-sm text-muted-foreground">{moderator.email}</p>
                </div>
                <Badge variant={moderator.isActive ? "default" : "secondary"} className="text-xs">
                  {moderator.isActive ? "Online" : "Offline"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-primary">{moderator.totalChats}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{moderator.activeChats}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-600">{moderator.flaggedChats}</p>
                  <p className="text-xs text-muted-foreground">Flagged</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => setSelectedModerator(moderator.id)}
              >
                View Chats
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Online Users & Chat Filters */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Online Users */}
        <Card className={isMobile ? 'order-2' : 'lg:col-span-1'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Users ({dummyOnlineUsers.length})
            </CardTitle>
            <CardDescription>Initiate conversations with online users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dummyOnlineUsers.slice(0, isMobile ? 3 : 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.lastActive}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInitiateChat(user)}
                  className="flex-shrink-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {isMobile && dummyOnlineUsers.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{dummyOnlineUsers.length - 3} more users
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chat Filters */}
        <Card className={`${isMobile ? 'order-1' : 'lg:col-span-2'}`}>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select value={selectedModerator} onValueChange={setSelectedModerator}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select moderator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderators</SelectItem>
                  {dummyAdmins
                    .filter(admin => admin.role === 'moderator')
                    .map(moderator => (
                      <SelectItem key={moderator.id} value={moderator.id}>
                        {moderator.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Conversations ({filteredConversations.length})
            {selectedModerator !== 'all' && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                - {dummyAdmins.find(a => a.id === selectedModerator)?.name}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Monitor and oversee chat conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} className="p-4 rounded-lg bg-card border border-border">
                <div className={`${isMobile ? 'flex-col space-y-3' : 'flex items-center justify-between'} mb-3`}>
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center ${isMobile ? 'flex-col space-y-1 items-start' : 'space-x-2'}`}>
                      <span className="font-medium text-foreground text-sm">{conversation.realUserName}</span>
                      {!isMobile && <span className="text-muted-foreground">↔</span>}
                      <span className="font-medium text-foreground text-sm">{conversation.dummyProfileName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={
                        conversation.status === 'flagged' ? 'destructive' :
                        conversation.status === 'assigned' ? 'default' : 'secondary'
                      } className="text-xs">
                        {conversation.status}
                      </Badge>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {conversation.unreadCount} unread
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`${isMobile ? 'text-left w-full' : 'text-right'}`}>
                    <p className="text-sm text-muted-foreground">{conversation.lastMessageTime}</p>
                    {conversation.assignedAdminId && (
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {dummyAdmins.find(a => a.id === conversation.assignedAdminId)?.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-3 p-3 bg-muted rounded border-l-4 border-primary">
                  <p className="text-sm text-muted-foreground mb-1">Latest message:</p>
                  <p className="text-foreground">{conversation.lastMessage}</p>
                </div>
                
                <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-wrap'}`}>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewConversation(conversation)}
                    className={isMobile ? 'w-full justify-start' : ''}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Thread
                  </Button>
                  
                  {conversation.assignedAdminId !== selectedModerator && selectedModerator !== 'all' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReassignChat(conversation.id, selectedModerator)}
                      className={isMobile ? 'w-full justify-start' : ''}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reassign
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found for the selected filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Detail Modal */}
      <Dialog open={isViewThreadOpen} onOpenChange={setIsViewThreadOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-none h-[90vh]' : 'max-w-4xl max-h-[80vh]'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {selectedConversation && 
                `Conversation between ${selectedConversation.realUserName} and ${selectedConversation.dummyProfileName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="space-y-4">
              {/* Conversation metadata */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Status:</p>
                    <Badge variant={
                      selectedConversation.status === 'flagged' ? 'destructive' :
                      selectedConversation.status === 'assigned' ? 'default' : 'secondary'
                    }>
                      {selectedConversation.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">Assigned Moderator:</p>
                    <p className="text-muted-foreground">
                      {selectedConversation.assignedAdminId 
                        ? dummyAdmins.find(a => a.id === selectedConversation.assignedAdminId)?.name
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="bg-card border rounded-lg p-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedConversation.messages.map((message: any) => (
                    <div key={message.id} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={message.isFromAdmin ? "secondary" : "default"}>
                            {message.isFromAdmin ? selectedConversation.dummyProfileName : selectedConversation.realUserName}
                          </Badge>
                          {message.isFromAdmin && message.adminId && (
                            <span className="text-xs text-muted-foreground">
                              (via {dummyAdmins.find(a => a.id === message.adminId)?.name})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.isFromAdmin 
                          ? 'bg-muted mr-8' 
                          : 'bg-primary text-primary-foreground ml-8'
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Chat Initiation Modal */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-none h-[90vh]' : 'max-w-2xl'}`}>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              {selectedUser && `Initiate a conversation with ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <p className="text-xs text-green-600">Active {selectedUser.lastActive}</p>
                  </div>
                </div>
              </div>

              {/* Profile Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Profile to Chat As:</label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dummy profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.name}>
                        <div className="flex items-center space-x-2">
                          <span>{profile.name}</span>
                          <span className="text-xs text-muted-foreground">({profile.age})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Message:</label>
                <Textarea
                  placeholder="Type your initial message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className={`${isMobile ? 'min-h-[120px]' : 'min-h-[100px]'} resize-none`}
                />
                <p className="text-xs text-muted-foreground">
                  {newMessage.length}/500 characters
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className={`${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
            <Button 
              variant="outline" 
              onClick={() => setIsNewChatOpen(false)}
              className={isMobile ? 'w-full' : ''}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendNewMessage}
              disabled={!selectedProfile || !newMessage.trim()}
              className={isMobile ? 'w-full' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatMonitor;