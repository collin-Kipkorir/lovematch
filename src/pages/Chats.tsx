import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatConversation from '../components/ChatConversation';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Navigation/BottomNav';

/**
 * CHATS PAGE
 * 
 * Features:
 * - Real-time messaging with Firebase
 * - End-to-end encryption for messages
 * - Message read receipts
 * - Unread message counts
 * - Credit system integration
 * - WhatsApp-like chat interface
 * - Responsive design
 */

const Chats = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isConversationView = location.pathname.startsWith('/chat/');

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto pt-4">
        <div className=" overflow-hidden">
          {isConversationView ? (
            <ChatConversation />
          ) : (
            <ChatList />
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Chats;