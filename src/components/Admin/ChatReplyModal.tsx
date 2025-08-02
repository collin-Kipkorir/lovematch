import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    participants: string[];
    messages: Array<{
      id: string;
      from: string;
      to: string;
      content: string;
      timestamp: string;
      status: string;
    }>;
  } | null;
}

const availableProfiles = [
  { id: '1', name: 'John Doe', avatar: 'JD' },
  { id: '2', name: 'Sarah Smith', avatar: 'SS' },
  { id: '3', name: 'Mike Johnson', avatar: 'MJ' },
  { id: '4', name: 'Emily Brown', avatar: 'EB' },
  { id: '5', name: 'Alex Rivera', avatar: 'AR' },
  { id: '6', name: 'Jordan Kim', avatar: 'JK' },
];

const ChatReplyModal: React.FC<ChatReplyModalProps> = ({ isOpen, onClose, conversation }) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<string>('');

  // Auto-select the last sender's profile for reply
  React.useEffect(() => {
    if (conversation && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const recipientProfile = availableProfiles.find(p => p.name === lastMessage.to);
      if (recipientProfile) {
        setSelectedProfile(recipientProfile.id);
      }
    }
  }, [conversation]);

  const handleSendReply = () => {
    if (!selectedProfile || !replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please select a profile and enter a message",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Reply Sent",
      description: `Message sent as ${availableProfiles.find(p => p.id === selectedProfile)?.name}`,
    });

    setReplyMessage('');
    setSelectedProfile('');
    onClose();
  };

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reply to Conversation</DialogTitle>
          <DialogDescription>
            Conversation between {conversation.participants.join(' and ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation History */}
          <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-card">
            <h4 className="font-medium mb-3 text-foreground">Conversation History</h4>
            <div className="space-y-3">
              {conversation.messages.map((message) => (
                <div key={message.id} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{message.from}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground bg-muted p-2 rounded">{message.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reply as Profile:</label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Select a profile to reply as" />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{profile.avatar}</AvatarFallback>
                      </Avatar>
                      <span>{profile.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Profile Preview */}
          {selectedProfile && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarFallback>
                  {availableProfiles.find(p => p.id === selectedProfile)?.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {availableProfiles.find(p => p.id === selectedProfile)?.name}
                </p>
                <Badge variant="secondary">Admin Reply</Badge>
              </div>
            </div>
          )}

          {/* Reply Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reply Message:</label>
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply message..."
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Send Reply</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatReplyModal;