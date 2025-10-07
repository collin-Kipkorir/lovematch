import { Chat, ChatMessage, ChatMetadata } from '../types/chat';

// Type for the cached data structure
interface CacheData {
  timestamp: number;
  data: any;
}

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const localCache = {
  set: (key: string, data: any) => {
    try {
      const cacheData: CacheData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  get: (key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { timestamp, data }: CacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  },

  // Specific methods for different data types
  chats: {
    getAll: () => localCache.get('chats') as Record<string, Chat> | null,
    set: (chats: Record<string, Chat>) => localCache.set('chats', chats),
    update: (chatId: string, chat: Chat) => {
      const chats = localCache.chats.getAll() || {};
      chats[chatId] = chat;
      localCache.chats.set(chats);
    },
    remove: (chatId: string) => {
      const chats = localCache.chats.getAll();
      if (chats && chats[chatId]) {
        delete chats[chatId];
        localCache.chats.set(chats);
      }
    }
  },

  messages: {
    get: (chatId: string) => localCache.get(`messages_${chatId}`) as ChatMessage[] | null,
    set: (chatId: string, messages: ChatMessage[]) => localCache.set(`messages_${chatId}`, messages),
    update: (chatId: string, message: ChatMessage) => {
      const messages = localCache.messages.get(chatId) || [];
      const index = messages.findIndex(m => m.id === message.id);
      if (index >= 0) {
        messages[index] = message;
      } else {
        messages.push(message);
      }
      localCache.messages.set(chatId, messages);
    }
  },

  favorites: {
    get: () => localCache.get('favorites') as string[] | null,
    set: (favorites: string[]) => localCache.set('favorites', favorites),
    add: (profileId: string) => {
      const favorites = localCache.favorites.get() || [];
      if (!favorites.includes(profileId)) {
        favorites.push(profileId);
        localCache.favorites.set(favorites);
      }
    },
    remove: (profileId: string) => {
      const favorites = localCache.favorites.get();
      if (favorites) {
        const newFavorites = favorites.filter(id => id !== profileId);
        localCache.favorites.set(newFavorites);
      }
    }
  }
};