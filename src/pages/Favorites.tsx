import React, { useState, useCallback, memo, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types/Profile';
import { useFavoriteProfiles } from '../hooks/useFavoriteProfiles';
import { useProfiles } from '../hooks/useProfiles';
import ProfileCard from '../components/ProfileCard/ProfileCard';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Navigation/BottomNav';
import { Heart, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';

const PROFILES_PER_PAGE = 20;

/**
 * FAVORITES PAGE - BACKEND INTEGRATION GUIDE
 * 
 * Current Features:
 * - Optimized profile loading with useFavoriteProfiles hook
 * - Local storage caching with 30min expiry
 * - Memoized components for better performance
 * - Progressive loading with Load More
 * - Loading skeletons for better UX
 * 
 * TODO Improvements:
 * - Remove from favorites functionality
 * - Sort options (recent, alphabetical, distance)
 * - Filter options (age, location, interests)
 * - Bulk actions (select multiple, remove all)
 * 
 * Performance Optimizations:
 * - Component memoization
 * - Local storage caching
 * - Progressive loading
 * - Lazy loaded modals
 * - Loading skeletons
 */

const LazyProfileModal = React.lazy(() => import('../components/ProfileModal'));

const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
    {Array.from({ length: PROFILES_PER_PAGE }).map((_, index) => (
      <div key={index} className="bg-card rounded-lg overflow-hidden border border-border/50 animate-pulse">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

const EmptyState = memo(() => (
  <div className="text-center py-12">
    <Users className="h-16 w-16 text-white/60 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2 text-white">No favorites yet</h3>
    <p className="text-white/70">
      Start liking profiles to see them here!
    </p>
  </div>
));

const ProfileGrid = memo(({ 
  profiles, 
  onProfileClick,
  page 
}: { 
  profiles: Profile[], 
  onProfileClick: (profile: Profile) => void,
  page: number 
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
    {profiles.slice(0, page * PROFILES_PER_PAGE).map((profile) => (
      <div
        key={profile.id}
        onClick={() => onProfileClick(profile)}
        className="animate-fade-in"
      >
        <ProfileCard profile={profile} />
      </div>
    ))}
  </div>
));

const LoadMoreButton = memo(({ 
  onClick, 
  isLoading 
}: { 
  onClick: () => void, 
  isLoading: boolean 
}) => (
  <div className="flex justify-center mt-8">
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant="secondary"
      className="hover:bg-primary/20 transition-colors"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        'Load More'
      )}
    </Button>
  </div>
));

const ErrorAlert = memo(({ message }: { message: string }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
));

const Favorites = () => {
  const { user, likedProfiles } = useAuth();
  // Debug: Read userLikes from localStorage
  let localStorageLikes: string[] = [];
  try {
    localStorageLikes = JSON.parse(localStorage.getItem('userLikes') || '[]');
  } catch (e) {
    localStorageLikes = [];
  }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [page, setPage] = useState(1);

  const {
    profiles: favoriteProfiles,
    isLoading,
    error,
    loadMore,
    hasMore
  } = useFavoriteProfiles({
    likedIds: likedProfiles,
    userId: user?.id
  });

  const handleProfileClick = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    setPage(p => p + 1);
    loadMore();
  }, [loadMore]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen ">
     
      <Header />
      
      <div className="container mx-auto p-4 pt-8 pb-20 md:pb-8">
        {error && <ErrorAlert message={error} />}

      

        {isLoading && !favoriteProfiles.length ? (
          <LoadingSkeleton />
        ) : favoriteProfiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ProfileGrid 
              profiles={favoriteProfiles}
              onProfileClick={handleProfileClick}
              page={page}
            />
            {hasMore && favoriteProfiles.length > page * PROFILES_PER_PAGE && (
              <LoadMoreButton 
                onClick={handleLoadMore}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </div>

      {selectedProfile && (
        <Suspense fallback={null}>
          <LazyProfileModal
            profile={selectedProfile}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
      
      <BottomNav />
    </div>
  );
};

export default memo(Favorites);