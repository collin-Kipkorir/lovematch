import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dummyProfiles, Profile } from '@/data/dummyProfiles';
import ProfileCard from '@/components/ProfileCard/ProfileCard';
import ProfileModal from '@/components/ProfileModal';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import { Heart, Users } from 'lucide-react';
import { useState } from 'react';

/**
 * FAVORITES PAGE - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace mock liked profiles with database queries
 * 
 * DATABASE INTEGRATION:
 * Query: Get all profiles liked by current user
 * SELECT p.* FROM profiles p
 * JOIN user_interactions ui ON p.id = ui.target_user_id
 * WHERE ui.user_id = current_user_id 
 * AND ui.interaction_type = 'like'
 * ORDER BY ui.created_at DESC
 * 
 * FEATURES TO IMPLEMENT:
 * - Remove from favorites functionality
 * - Sort options (recent, alphabetical, distance)
 * - Filter options (age, location, interests)
 * - Bulk actions (select multiple, remove all)
 * 
 * REAL-TIME UPDATES:
 * - Listen for profile updates of favorited users
 * - Notify when favorited user updates profile
 * - Remove profiles if user deactivates account
 * 
 * MUTUAL LIKES (MATCHES):
 * - Highlight mutual likes differently
 * - Show "It's a Match!" indicator
 * - Enable direct messaging for matches
 * 
 * ANALYTICS:
 * - Track favorite interactions
 * - Monitor conversion from favorite to chat
 * - A/B test favorite display formats
 */

const Favorites: React.FC = () => {
  const { user, likedProfiles } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favoriteProfiles = useMemo(() => {
    if (!user || likedProfiles.length === 0) return [];
    
    return dummyProfiles.filter(profile => 
      likedProfiles.includes(profile.id)
    );
  }, [user, likedProfiles]);

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <div className="container mx-auto p-4 pt-8 pb-20 md:pb-8">

        {favoriteProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No favorites yet</h3>
            <p className="text-white/70">
              Start liking profiles to see them here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {favoriteProfiles.map((profile, index) => (
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

export default Favorites;