import { useEffect, useState, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get, startAfter, limitToFirst } from 'firebase/database';
import { User } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { localCache } from '@/lib/localCache';

const BATCH_SIZE = 10;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export interface Profile extends Omit<User, 'credits' | 'videoCredits'> {
  id: string;
  name: string;
  age: number;
  bio?: string;
  images: string[];
  gender: 'male' | 'female' | 'other';
  location?: string;
  interests?: string[];
  lastActive: string;
  isOnline?: boolean;
  isDummy?: boolean;
  isVerified?: boolean;
  distance?: number;
  avatar?: string;
}

interface ProfileFilters {
  gender?: 'Male' | 'Female' | 'All';
  minAge?: number;
  maxAge?: number;
  location?: string;
  maxDistance?: number;
}

interface CachedProfiles {
  profiles: Profile[];
  timestamp: number;
  filters: ProfileFilters | undefined;
}

export const useProfiles = (filters?: ProfileFilters) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Clear profiles when unmounting to prevent duplicates
  useEffect(() => {
    return () => {
      setProfiles([]);
      setLastKey(null);
      setHasMore(true);
      setInitialLoadDone(false);
    };
  }, []);

  const loadProfiles = useCallback(async (loadMore = false) => {
    if (!user) return;

    try {
      if (!loadMore) {
        // Reset state for fresh load
        setProfiles([]);
        setLastKey(null);

        // Check cache for initial load
        const cachedData = localCache.get('profiles') as CachedProfiles | null;
        if (cachedData && 
          Date.now() - cachedData.timestamp < CACHE_EXPIRY && 
          JSON.stringify(cachedData.filters) === JSON.stringify(filters)) {
          setProfiles(cachedData.profiles);
          setLoading(false);
          setInitialLoadDone(true);
          return;
        }
        setLoading(true);
      }

      setError(null);

      // Create base query
      const baseRef = ref(database, 'users');
      let genderQuery = query(baseRef);
      
      // Apply filters
      if (filters?.gender && filters.gender !== 'All') {
        genderQuery = query(
          baseRef,
          orderByChild('gender'),
          equalTo(filters.gender)
        );
      } else {
        genderQuery = query(
          baseRef,
          orderByChild('lastActive')
        );
      }

      // Add pagination
      if (loadMore && lastKey) {
        genderQuery = query(genderQuery, startAfter(lastKey));
      }
      genderQuery = query(genderQuery, limitToFirst(BATCH_SIZE + 1));

      // Fetch profiles
      const snapshot = await get(genderQuery);
      let newProfiles: Profile[] = [];

      if (snapshot.exists()) {
        const profilesData = snapshot.val();
        newProfiles = Object.entries(profilesData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter(profile => {
            if (filters?.minAge && profile.age < filters.minAge) return false;
            if (filters?.maxAge && profile.age > filters.maxAge) return false;
            return true;
          })
          .sort((a, b) => {
            const dateA = new Date(a.lastActive).getTime();
            const dateB = new Date(b.lastActive).getTime();
            return dateB - dateA;
          });
      }

      // Check if there are more results
      const hasMoreResults = newProfiles.length > BATCH_SIZE;
      if (hasMoreResults) {
        newProfiles = newProfiles.slice(0, BATCH_SIZE);
      }
      setHasMore(hasMoreResults);

      // Update last key for pagination
      if (newProfiles.length > 0) {
        setLastKey(newProfiles[newProfiles.length - 1].id);
      }

      // Update profiles state
      if (loadMore) {
        setProfiles(prev => [...prev, ...newProfiles]);
      } else {
        setProfiles(newProfiles);
        // Cache initial results
        localCache.set('profiles', {
          profiles: newProfiles,
          timestamp: Date.now(),
          filters
        });
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, [user, filters, lastKey]);

  // Load initial profiles
  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user, loadProfiles]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadProfiles(true);
    }
  }, [loading, hasMore, loadProfiles]);

  // Helper to get a profile by userId
  const getProfile = (userId: string) => profiles.find(p => p.id === userId);

  return {
    profiles,
    loading,
    error,
    hasMore,
    loadMore,
    initialLoadDone,
    getProfile
  };
};