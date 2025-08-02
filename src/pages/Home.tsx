import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { dummyProfiles, Profile } from '@/data/dummyProfiles';
import ProfileCard from '@/components/ProfileCard/ProfileCard';
import ProfileModal from '@/components/ProfileModal';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import LandingPage from './LandingPage';
import { Users } from 'lucide-react';

/**
 * HOME PAGE (DISCOVER) - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace dummy profiles with real database data
 * 
 * DATABASE SCHEMA:
 * Table: profiles
 * - id (uuid, primary key)
 * - user_id (uuid, foreign key to auth.users)
 * - name (text)
 * - age (integer)
 * - gender (text)
 * - location (text)
 * - bio (text)
 * - interests (text[])
 * - profile_pictures (text[])
 * - created_at (timestamp)
 * - updated_at (timestamp)
 * - is_verified (boolean)
 * - is_active (boolean)
 * 
 * MATCHING ALGORITHM:
 * - Implement location-based filtering (radius search)
 * - Age range preferences
 * - Gender preferences
 * - Interest matching scores
 * - Exclude already liked/disliked profiles
 * - Implement swipe-based interactions
 * 
 * REAL-TIME FEATURES:
 * - Profile updates via Supabase realtime
 * - Online status indicators
 * - New profile notifications
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Implement pagination for profile loading
 * - Cache profiles locally
 * - Preload profile images
 * - Lazy loading for better performance
 * 
 * USER INTERACTIONS:
 * Table: user_interactions
 * - user_id (uuid)
 * - target_user_id (uuid)
 * - interaction_type ('like', 'dislike', 'super_like')
 * - created_at (timestamp)
 */

const Home: React.FC = () => {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProfiles = useMemo(() => {
    if (!user) return [];
    
    return dummyProfiles.filter(profile => {
      // Don't show the user's own profile
      if (profile.id === user.id) return false;
      
      // Filter based on user's preferences
      if (user.lookingFor === 'Male') return profile.gender === 'Male';
      if (user.lookingFor === 'Female') return profile.gender === 'Female';
      return true; // 'All' shows everyone
    }); // No limit - show all matching profiles
  }, [user]);

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated user view - show matches
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <div className="container mx-auto p-4 pt-8 pb-20 md:pb-8">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No matches found</h3>
            <p className="text-white/70">
              Try adjusting your preferences or check back later for new profiles!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProfiles.map((profile, index) => (
              <div 
                key={profile.id} 
                style={{ animationDelay: `${index * 0.1}s` }}
                className="animate-slide-up"
              >
                <ProfileCard 
                  profile={profile} 
                  onClick={() => handleProfileClick(profile)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileModal 
        profile={selectedProfile}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      <BottomNav />
    </div>
  );
};

export default Home;