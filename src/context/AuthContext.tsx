import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, get, push, query, orderByChild, equalTo, onValue, update } from 'firebase/database';
import { generateEncryptionKey, exportPublicKey, exportPrivateKey, importPrivateKey } from '../lib/encryption';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  profileImage: string;
  gender: 'Male' | 'Female' | 'Other';
  lookingFor: 'Male' | 'Female' | 'All';
  age: number;
  location?: string;
  bio: string;
  interests: string[];
  credits: number;
  videoCredits: number;
  isActive: boolean;
  lastActive: string;
  publicKey?: string;
  privateKey?: CryptoKey;
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
  loginWithEmailAndPhone: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'credits' | 'videoCredits' | 'isActive' | 'lastActive'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCredits: (amount: number) => Promise<void>;
  updateVideoCredits: (amount: number) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  toggleLikeProfile: (profileId: string) => Promise<void>;
  addChatConversation: (profile: any) => void;
  updateChatConversation: (profileId: string, lastMessage: string) => void;
  deleteChatConversation: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to hash password using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [likedProfiles, setLikedProfiles] = useState<string[]>(() => {
    const storedLikes = localStorage.getItem('userLikes');
    return storedLikes ? JSON.parse(storedLikes) : [];
  });
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);

  // Sync liked profiles with local storage
  useEffect(() => {
    if (likedProfiles.length > 0 || localStorage.getItem('userLikes')) {
      localStorage.setItem('userLikes', JSON.stringify(likedProfiles));
    }
  }, [likedProfiles]);

  // Set up real-time listeners when user logs in
  useEffect(() => {
    if (!user) {
      setLikedProfiles([]);
      localStorage.removeItem('userLikes');
      return;
    }

    // Listen for user credit updates
    const userRef = ref(database, `users/${user.id}`);
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        // Don't update lastActive or isActive from the listener to avoid loops
        const { password, lastActive, isActive, ...updatableFields } = userData;
        setUser(prev => ({ 
          ...prev!, 
          ...updatableFields,
          // Preserve these from previous state to avoid loops
          lastActive: prev?.lastActive || lastActive,
          isActive: prev?.isActive || isActive
        }));
      }
    });

    // Listen for liked profiles
    // Initial load of likes from Firebase
    const loadLikesFromFirebase = async () => {
      const likesRef = ref(database, `userLikes/${user.id}`);
      const snapshot = await get(likesRef);
      if (snapshot.exists()) {
        const likes = snapshot.val();
        const likedIds = Object.keys(likes);
        setLikedProfiles(prev => {
          const merged = Array.from(new Set([...prev, ...likedIds]));
          localStorage.setItem('userLikes', JSON.stringify(merged));
          return merged;
        });
      }
    };
    loadLikesFromFirebase();

    // Listen for chat conversations
    const chatsRef = ref(database, `userChats/${user.id}`);
    const unsubscribeChats = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const chats = Object.values(snapshot.val()) as ChatConversation[];
        setChatConversations(chats.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } else {
        setChatConversations([]);
      }
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, [user]);

  // Separate effect for handling online/offline status
  useEffect(() => {
    if (!user) return;

    const userRef = ref(database, `users/${user.id}`);
    const userStatusRef = ref(database, `.info/connected`);

    // Update user's active status
    const updateActiveStatus = async () => {
      await update(userRef, {
        isActive: true,
        lastActive: new Date().toISOString()
      });
    };
    updateActiveStatus();

    // Set up inactive status on disconnect
    const unsubscribeStatus = onValue(userStatusRef, async (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      await update(userRef, {
        isActive: false,
        lastActive: new Date().toISOString()
      });
    });

    return () => {
      unsubscribeStatus();
    };
  }, [user?.id]);

  const loginWithEmailAndPhone = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersRef = ref(database, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(emailQuery);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const users = snapshot.val();
      const userId = Object.keys(users)[0];
      const userData = users[userId];
      
      // Verify password
      if (!userData.password || userData.password !== password) {
        throw new Error('Invalid password');
      }

      const { password: _, ...userWithoutPassword } = userData;
      
      try {
        // Update last login time
        await update(ref(database, `users/${userId}`), {
          lastActive: new Date().toISOString(),
          isActive: true
        });
      } catch (updateError) {
        console.error('Failed to update last login time:', updateError);
        // Continue with login even if updating last login time fails
      }
      
      // Get private key from localStorage or generate new keys if needed
      let privateKeyString = localStorage.getItem(`privateKey_${userId}`);
      let privateKey: CryptoKey | undefined;
      
      if (!privateKeyString || !userWithoutPassword.publicKey) {
        // Generate new key pair if we don't have keys
        const keyPair = await generateEncryptionKey();
        const publicKeyString = await exportPublicKey(keyPair.publicKey);
        privateKeyString = await exportPrivateKey(keyPair.privateKey);
        
        // Update public key in Firebase
        await update(ref(database, `users/${userId}`), {
          publicKey: publicKeyString
        });
        
        // Store new private key
        localStorage.setItem(`privateKey_${userId}`, privateKeyString);
        privateKey = keyPair.privateKey;
      } else {
        // Import existing private key
        try {
          privateKey = await importPrivateKey(privateKeyString);
        } catch (error) {
          console.error('Error importing private key:', error);
          // Generate new key pair if import fails
          const keyPair = await generateEncryptionKey();
          const publicKeyString = await exportPublicKey(keyPair.publicKey);
          privateKeyString = await exportPrivateKey(keyPair.privateKey);
          
          await update(ref(database, `users/${userId}`), {
            publicKey: publicKeyString
          });
          
          localStorage.setItem(`privateKey_${userId}`, privateKeyString);
          privateKey = keyPair.privateKey;
        }
      }

      // Store session in localStorage
      localStorage.setItem('user', JSON.stringify({
        ...userWithoutPassword,
        id: userId
      }));
      
      setUser({
        ...userWithoutPassword,
        id: userId,
        privateKey // Include the CryptoKey object in memory
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'credits' | 'videoCredits' | 'isActive' | 'lastActive' | 'publicKey' | 'privateKey'> & { password: string }) => {
    try {
      // Check if email already exists
      const usersRef = ref(database, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(userData.email));
      const emailSnapshot = await get(emailQuery);
      
      if (emailSnapshot.exists()) {
        throw new Error('Email already exists');
      }
      
      // Generate a unique ID for the user and encryption keys
      const newUserRef = push(ref(database, 'users'));
      const { password, ...userDataWithoutPassword } = userData;
      
      // Generate encryption keys
      const keyPair = await generateEncryptionKey();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      
      const newUser: User = {
        ...userDataWithoutPassword,
        id: newUserRef.key!,
        credits: 5, // Initial free credits
        videoCredits: 0,
        isActive: true,
        lastActive: new Date().toISOString(),
        publicKey: publicKeyString,
        privateKey: keyPair.privateKey
      };
      
      // Store user data in Firebase (without private key)
      const { privateKey, ...userDataForFirebase } = newUser;
      const userDataToStore = {
        ...userDataForFirebase,
        password // Store password in database (in real app, should be hashed)
      };
      
      await set(newUserRef, userDataToStore);
      
      // Store session in localStorage (including privateKey)
      const userDataForLocal = {
        ...newUser,
        privateKey: null // CryptoKey can't be stringified, store it separately
      };
      localStorage.setItem('user', JSON.stringify(userDataForLocal));
      localStorage.setItem(`privateKey_${newUser.id}`, keyPair.privateKey.toString());
      
      // Set user in context without password
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!user) return;

    try {
      // Update last active status
      await update(ref(database, `users/${user.id}`), {
        isActive: false,
        lastActive: new Date().toISOString()
      });

      // Clear local storage
      localStorage.removeItem('user');

      setUser(null);
      setLikedProfiles([]);
      setChatConversations([]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateCredits = async (amount: number) => {
    if (!user) return;

    try {
      const userRef = ref(database, `users/${user.id}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const currentCredits = snapshot.val().credits || 0;
        const newCredits = Math.max(0, currentCredits + amount);
        
        await update(userRef, { credits: newCredits });

        // Also log the transaction
        const transactionRef = push(ref(database, 'creditTransactions'));
        await set(transactionRef, {
          userId: user.id,
          amount,
          type: amount > 0 ? 'credit' : 'debit',
          timestamp: new Date().toISOString(),
          balance: newCredits
        });
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      throw error;
    }
  };

  const updateVideoCredits = async (amount: number) => {
    if (!user) return;

    try {
      const userRef = ref(database, `users/${user.id}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const currentCredits = snapshot.val().videoCredits || 0;
        const newCredits = Math.max(0, currentCredits + amount);
        
        await update(userRef, { videoCredits: newCredits });

        // Log the transaction
        const transactionRef = push(ref(database, 'videoCreditsTransactions'));
        await set(transactionRef, {
          userId: user.id,
          amount,
          type: amount > 0 ? 'credit' : 'debit',
          timestamp: new Date().toISOString(),
          balance: newCredits
        });
      }
    } catch (error) {
      console.error('Error updating video credits:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    try {
      await update(ref(database, `users/${user.id}`), userData);
      // Optimistically update local user state so UI reflects changes immediately
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, ...userData } as User;
        try {
          // Store a serializable copy in localStorage (remove non-serializable fields)
          const toStore: any = { ...updated };
          if (toStore.privateKey) delete toStore.privateKey;
          localStorage.setItem('user', JSON.stringify(toStore));
        } catch (e) {
          // ignore localStorage errors
        }
        return updated;
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const toggleLikeProfile = async (profileId: string) => {
    if (!user) return;

    try {
      // Update local state first for instant feedback
      const isCurrentlyLiked = likedProfiles.includes(profileId);
      if (isCurrentlyLiked) {
        // Unlike
        setLikedProfiles(prev => prev.filter(id => id !== profileId));
      } else {
        // Like
        setLikedProfiles(prev => [...prev, profileId]);
      }

      // Then sync with Firebase
      const likeRef = ref(database, `userLikes/${user.id}/${profileId}`);
      if (isCurrentlyLiked) {
        await set(likeRef, null);
      } else {
        await set(likeRef, {
          timestamp: new Date().toISOString()
        });

        // Check for mutual like
        const mutualLikeRef = ref(database, `userLikes/${profileId}/${user.id}`);
        const mutualSnapshot = await get(mutualLikeRef);
        
        if (mutualSnapshot.exists()) {
          // Create a match
          const matchId = [user.id, profileId].sort().join('_');
          await set(ref(database, `matches/${matchId}`), {
            users: [user.id, profileId],
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  const addChatConversation = async (profile: Omit<User, 'password'>) => {
    if (!user) return;

    try {
      const chatId = [user.id, profile.id].sort().join('_');
      await set(ref(database, `userChats/${user.id}/${chatId}`), {
        id: chatId,
        profileId: profile.id,
        name: profile.name,
        avatar: profile.profileImage,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        unread: 0
      });
    } catch (error) {
      console.error('Error adding chat:', error);
    }
  };

  const updateChatConversation = async (profileId: string, lastMessage: string) => {
    if (!user) return;

    try {
      const chatId = [user.id, profileId].sort().join('_');
      await update(ref(database, `userChats/${user.id}/${chatId}`), {
        lastMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const deleteChatConversation = async (profileId: string) => {
    if (!user) return;

    try {
      const chatId = [user.id, profileId].sort().join('_');
      await set(ref(database, `userChats/${user.id}/${chatId}`), null);
      setChatConversations(prev => prev.filter(chat => chat.profileId !== profileId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      likedProfiles, 
      chatConversations, 
      loginWithEmailAndPhone, 
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