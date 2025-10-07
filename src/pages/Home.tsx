import React, { useState, Suspense, lazy, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import LandingPage from './LandingPage';
import { Users, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProfileFilters } from '@/types/filters';

const PROFILES_PER_PAGE = 20;
const LoadingSkeleton = React.memo(() => (
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
// Lazy load components
const ProfileCard = lazy(() => import('@/components/ProfileCard/ProfileCardOptimized'));
const ProfileModal = lazy(() => import('@/components/ProfileModal'));

// IntersectionObserver options
const observerOptions = {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update the filter state to use "all" instead of undefined
  const [filters, setFilters] = useState<ProfileFilters>({
    minAge: 18,
    maxAge: 99,
    location: "all" // Change from undefined to "all"
  });

  // Add state for available locations
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Get profiles with user's preferences first
  const { profiles, loading, hasMore, loadMore, error } = useProfiles(
    useMemo(() => user ? {
      ...filters,
      gender: user.lookingFor,
    } : undefined, [user?.lookingFor, filters])
  );

  // Extract unique locations from profiles after profiles are loaded
  useEffect(() => {
    if (!profiles) return;
    
    const locations = new Set<string>();
    profiles.forEach(profile => {
      if (profile.location) {
        locations.add(profile.location);
      }
    });
    setAvailableLocations(Array.from(locations).sort());
  }, [profiles]);

  // Memoize unique profiles to prevent duplicates and sort by location match
  const uniqueProfiles = useMemo(() => {
    const seen = new Set<string>();
    
    // First deduplicate the profiles
    const dedupedProfiles = profiles.filter(profile => {
      if (seen.has(profile.id)) return false;
      seen.add(profile.id);
      return true;
    });

    // Sort profiles based on how well they match filters and user's location
    return dedupedProfiles.sort((a, b) => {
      let aScore = 0;
      let bScore = 0;

      // Same location as current user (highest priority)
      if (user?.location === a.location) aScore += 200;
      if (user?.location === b.location) bScore += 200;

      // Selected location match
      if (filters.location === "all" || a.location === filters.location) aScore += 100;
      if (filters.location === "all" || b.location === filters.location) bScore += 100;

      // Age range match
      const aAge = a.age || 0;
      const bAge = b.age || 0;
      if (aAge >= filters.minAge && aAge <= filters.maxAge) aScore += 50;
      if (bAge >= filters.minAge && bAge <= filters.maxAge) bScore += 50;

      // Distance from preferred age range (if outside range)
      if (aAge < filters.minAge) {
        aScore -= (filters.minAge - aAge);
      } else if (aAge > filters.maxAge) {
        aScore -= (aAge - filters.maxAge);
      }
      
      if (bAge < filters.minAge) {
        bScore -= (filters.minAge - bAge);
      } else if (bAge > filters.maxAge) {
        bScore -= (bAge - filters.maxAge);
      }

      // Sort by score (descending)
      return bScore - aScore;
    });
  }, [profiles, filters, user?.location]); // Add user.location to dependencies

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, observerOptions);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  const handleProfileClick = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  }, []);

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto p-4 pb-20 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {uniqueProfiles.length} {uniqueProfiles.length === 1 ? 'match' : 'matches'}
          </p>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Profiles</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 py-4">
                {/* Age Range Filter */}
                <div className="space-y-2">
                  <Label>Age Range: {filters.minAge} - {filters.maxAge}</Label>
                  <Slider
                    min={18}
                    max={99}
                    step={1}
                    value={[filters.minAge, filters.maxAge]}
                    onValueChange={([min, max]) => 
                      setFilters(prev => ({ ...prev, minAge: min, maxAge: max }))
                    }
                    className="mt-2"
                  />
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, location: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Location</SelectItem>
                      {availableLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-center">Error Loading Profiles</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Profile Grid */}
            {loading && uniqueProfiles.length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {uniqueProfiles.map((profile) => (
                  <Suspense
                    key={profile.id}
                    fallback={
                      <div className="bg-card rounded-lg overflow-hidden border border-border/50 animate-pulse">
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
                    }
                  >
                    <ProfileCard
                      profile={profile}
                      onClick={() => handleProfileClick(profile)}
                    />
                  </Suspense>
                ))}
              </div>
            )}

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {loading && uniqueProfiles.length > 0 && (
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
      
      {/* Profile Modal */}
      {selectedProfile && (
        <Suspense fallback={null}>
          <ProfileModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            profile={selectedProfile}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Home;