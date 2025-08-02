import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  lookingFor: 'Male' | 'Female' | 'All';
  age: number;
  location?: string;
  bio: string;
  interests: string[];
  credits: number;
  videoCredits: number;
}

export interface ChatConversation {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  profilePicture?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface AuthContextType {
  user: User | null;
  likedProfiles: string[];
  chatConversations: ChatConversation[];
  login: (email: string, password: string) => boolean;
  register: (userData: Omit<User, 'id' | 'credits' | 'videoCredits'>) => void;
  logout: () => void;
  updateCredits: (amount: number) => void;
  updateVideoCredits: (amount: number) => void;
  updateUser: (userData: User) => void;
  toggleLikeProfile: (profileId: string) => void;
  addChatConversation: (profile: any) => void;
  updateChatConversation: (profileId: string, lastMessage: string) => void;
  deleteChatConversation: (profileId: string) => void; // Added delete chat functionality
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('matchmaking_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedLikes = localStorage.getItem('matchmaking_liked_profiles');
    if (savedLikes) {
      setLikedProfiles(JSON.parse(savedLikes));
    }

    const savedChats = localStorage.getItem('matchmaking_chat_conversations');
    if (savedChats) {
      setChatConversations(JSON.parse(savedChats));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // Dummy login - in real app, this would call an API
    const isAdmin = email === 'admin@lovematch.com';
    const dummyUser: User = {
      id: isAdmin ? 'admin' : '1',
      name: isAdmin ? 'Admin User' : 'Demo User',
      email,
      gender: 'Male',
      lookingFor: 'Female',
      age: 28,
      location: isAdmin ? 'Admin Panel' : 'Demo City',
      bio: isAdmin ? 'Platform Administrator' : 'Demo user for testing',
      interests: isAdmin ? ['admin', 'management'] : ['demo'],
      credits: isAdmin ? 999999 : 5,
      videoCredits: isAdmin ? 999999 : 0
    };
    
    setUser(dummyUser);
    localStorage.setItem('matchmaking_user', JSON.stringify(dummyUser));
    return true;
  };

  const register = (userData: Omit<User, 'id' | 'credits' | 'videoCredits'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      credits: 5,
      videoCredits: 0
    };
    
    setUser(newUser);
    localStorage.setItem('matchmaking_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setLikedProfiles([]);
    setChatConversations([]);
    localStorage.removeItem('matchmaking_user');
    localStorage.removeItem('matchmaking_liked_profiles');
    localStorage.removeItem('matchmaking_chat_conversations');
  };

  const updateCredits = (amount: number) => {
    if (user) {
      // Admin always has unlimited credits
      const newCredits = user.id === 'admin' ? 999999 : Math.max(0, user.credits + amount);
      const updatedUser = { ...user, credits: newCredits };
      setUser(updatedUser);
      localStorage.setItem('matchmaking_user', JSON.stringify(updatedUser));
    }
  };

  const updateVideoCredits = (amount: number) => {
    if (user) {
      // Admin always has unlimited video credits
      const newVideoCredits = user.id === 'admin' ? 999999 : Math.max(0, user.videoCredits + amount);
      const updatedUser = { ...user, videoCredits: newVideoCredits };
      setUser(updatedUser);
      localStorage.setItem('matchmaking_user', JSON.stringify(updatedUser));
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('matchmaking_user', JSON.stringify(userData));
  };

  const toggleLikeProfile = (profileId: string) => {
    const updatedLikes = likedProfiles.includes(profileId)
      ? likedProfiles.filter(id => id !== profileId)
      : [...likedProfiles, profileId];
    
    setLikedProfiles(updatedLikes);
    localStorage.setItem('matchmaking_liked_profiles', JSON.stringify(updatedLikes));
  };

  const addChatConversation = (profile: any) => {
    const existingChat = chatConversations.find(chat => chat.profileId === profile.id);
    if (existingChat) return; // Chat already exists

    const newChat: ChatConversation = {
      id: `chat_${profile.id}`,
      profileId: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      profilePicture: profile.profilePicture,
      lastMessage: "Chat started",
      timestamp: "now",
      unread: 0
    };

    const updatedChats = [...chatConversations, newChat];
    setChatConversations(updatedChats);
    localStorage.setItem('matchmaking_chat_conversations', JSON.stringify(updatedChats));
  };

  const updateChatConversation = (profileId: string, lastMessage: string) => {
    const updatedChats = chatConversations.map(chat => 
      chat.profileId === profileId 
        ? { ...chat, lastMessage, timestamp: "now", unread: chat.unread + 1 }
        : chat
    );
    setChatConversations(updatedChats);
    localStorage.setItem('matchmaking_chat_conversations', JSON.stringify(updatedChats));
  };

  /**
   * DELETE CHAT CONVERSATION - Backend Integration Guide
   * TODO: Replace with API call to backend
   * 
   * API Endpoint: DELETE /api/conversations/{conversationId}
   * - Soft delete conversation (set is_deleted = true)
   * - Remove all messages for user (keep for admin audit trail)
   * - Update user's conversation list
   * - Send real-time notification to other participant
   * 
   * Security considerations:
   * - Verify user owns this conversation
   * - Rate limit deletion requests
   * - Log deletion for audit purposes
   */
  const deleteChatConversation = (profileId: string) => {
    const updatedChats = chatConversations.filter(chat => chat.profileId !== profileId);
    setChatConversations(updatedChats);
    localStorage.setItem('matchmaking_chat_conversations', JSON.stringify(updatedChats));
    
    // TODO: Also remove individual chat messages from localStorage
    localStorage.removeItem(`chat_${profileId}`);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      likedProfiles, 
      chatConversations, 
      login, 
      register, 
      logout, 
      updateCredits, 
      updateVideoCredits, 
      updateUser,
      toggleLikeProfile, 
      addChatConversation, 
      updateChatConversation,
      deleteChatConversation
    }}>
      {children}
    </AuthContext.Provider>
  );
};