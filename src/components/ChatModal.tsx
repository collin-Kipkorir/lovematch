import React, { useState } from 'react';
import ChatConversation from './ChatConversation';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { DialogTitle, DialogDescription } from '@radix-ui/react-dialog';

export default function ChatModal({ open, onOpenChange, otherUserId }: { open: boolean; onOpenChange: (open: boolean) => void; otherUserId: string | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl w-full h-[90vh] flex flex-col bg-gray-900 text-white border-gray-800">
        <DialogTitle className="sr-only">Chat Conversation</DialogTitle>
        <DialogDescription className="sr-only">Private chat conversation window</DialogDescription>
  {otherUserId && <ChatConversation otherUserId={otherUserId} onBack={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
