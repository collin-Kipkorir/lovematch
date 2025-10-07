import { useState, useEffect, useCallback, useRef } from 'react';
import { Profile } from '@/hooks/useProfiles';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface UseFavoriteProfilesProps {
  likedIds: string[];
  userId: string | undefined;
}

interface UseFavoriteProfilesReturn {
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

const BATCH_SIZE = 10;
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes
export function useFavoriteProfiles(props: UseFavoriteProfilesProps): UseFavoriteProfilesReturn {

  const { likedIds, userId } = props;

  // On first render, get likedIds from localStorage for instant UI
  const getLocalStorageLikes = () => {
    try {
      const stored = localStorage.getItem('userLikes');
      if (stored) {
        return JSON.parse(stored) as string[];
      }
    } catch (e) {
      // ignore JSON parse / access errors
    }
    return null;
  };

  // Use a ref to capture localStorage on first render as a fallback
  const initialLikedIdsRef = useRef<string[] | null>(getLocalStorageLikes());
  // Prefer the live prop `likedIds` (source of truth). Fall back to initial localStorage snapshot only when prop is empty.
  const effectiveLikedIds = (() => {
    return (likedIds && likedIds.length > 0) ? likedIds : (initialLikedIdsRef.current ?? []);
  })();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Function to check if cached data is still valid
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_EXPIRY;
  };

  // Function to get profile from cache
  const getFromCache = useCallback((profileId: string): Profile | null => {
    const cacheKey = `profile_${profileId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (isCacheValid(timestamp)) {
        return data;
      }
      localStorage.removeItem(cacheKey); // Remove expired cache
    }
    return null;
  }, []);

  // Function to set profile in cache
  const setInCache = useCallback((profileId: string, profile: Profile) => {
    const cacheKey = `profile_${profileId}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data: profile,
      timestamp: Date.now()
    }));
  }, []);

  // Load profiles in batches
  const loadBatch = useCallback(async (idsToLoad: string[]) => {
    const newProfiles: Profile[] = [];
    const errors: Error[] = [];

    await Promise.all(
      idsToLoad.map(async (id) => {
        try {
          // Try cache first
          const cached = getFromCache(id);
          if (cached) {
            newProfiles.push(cached);
            return;
          }

          // Fetch from Firebase if not in cache
          // Profiles are stored under `users` in the realtime database
          const profileRef = ref(database, `users/${id}`);
          const snapshot = await get(profileRef);
          
          if (snapshot.exists()) {
            const profile = { id, ...snapshot.val() };
            newProfiles.push(profile);
            setInCache(id, profile);
          }
        } catch (err) {
          console.error(`Error loading profile ${id}:`, err);
          errors.push(err as Error);
        }
      })
    );

    if (errors.length > 0) {
      setError(errors[0]); // Set the first error encountered
    }

    return newProfiles;
  }, [getFromCache, setInCache]);

  // Load initial batch
  useEffect(() => {
    const loadInitialBatch = async () => {
      if (!userId || !effectiveLikedIds || effectiveLikedIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const initialIds = effectiveLikedIds.slice(0, BATCH_SIZE);
        const initialProfiles = await loadBatch(initialIds);
        setProfiles(initialProfiles);
        setLoadedIds(new Set(initialIds));
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialBatch();
  }, [userId, effectiveLikedIds, loadBatch]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoading) return;

    const start = loadedIds.size;
    const end = Math.min(start + BATCH_SIZE, effectiveLikedIds.length);
    
    if (start >= end) return;

    setIsLoading(true);
    const nextIds = effectiveLikedIds.slice(start, end);

    try {
      const newProfiles = await loadBatch(nextIds);
      setProfiles(prev => [...prev, ...newProfiles]);
      setLoadedIds(prev => new Set([...prev, ...nextIds]));
      setPage(p => p + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, effectiveLikedIds, loadedIds, loadBatch]);

  // If the list of liked IDs shrinks (user unliked someone), remove those profiles immediately
  useEffect(() => {
    if (!effectiveLikedIds || effectiveLikedIds.length === 0) {
      setProfiles([]);
      setLoadedIds(new Set());
      return;
    }

    setProfiles(prev => prev.filter(p => effectiveLikedIds.includes(p.id)));
    setLoadedIds(prev => {
      const filtered = new Set<string>(Array.from(prev).filter(id => effectiveLikedIds.includes(id)));
      return filtered;
    });
  }, [effectiveLikedIds]);

  const hasMore = loadedIds.size < (effectiveLikedIds ? effectiveLikedIds.length : 0);

  return {
    profiles,
    isLoading,
    error,
    loadMore,
    hasMore
  };
}