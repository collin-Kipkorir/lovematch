import React, { useState } from 'react';
import { Profile } from '@/data/dummyProfiles';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';

/**
 * PROFILE CARD COMPONENT - BACKEND INTEGRATION GUIDE
 * 
 * DATABASE SCHEMA:
 * Table: user_profiles
 * - id (uuid, primary key, foreign key to auth.users)
 * - name (text)
 * - age (integer)
 * - gender (enum: 'male', 'female', 'other')
 * - location (text)
 * - bio (text)
 * - interests (text[]) - array of interests
 * - profile_pictures (text[]) - array of image URLs
 * - avatar_emoji (text) - fallback emoji
 * - is_verified (boolean)
 * - is_premium (boolean)
 * - last_active (timestamp)
 * - created_at (timestamp)
 * 
 * Table: user_interactions
 * - id (uuid, primary key)
 * - user_id (uuid, foreign key to auth.users)
 * - target_user_id (uuid, foreign key to auth.users)
 * - interaction_type (enum: 'like', 'dislike', 'super_like', 'view')
 * - created_at (timestamp)
 * 
 * FEATURES TO IMPLEMENT:
 * - Like/unlike functionality with mutual match detection
 * - Profile view tracking for analytics
 * - Super likes with premium features
 * - Block/report functionality
 * - Credit-based messaging system
 * - Real-time online status
 * - Profile verification badges
 * - Distance calculation using PostGIS
 */

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick }) => {
  const { user, toggleLikeProfile, likedProfiles, addChatConversation, updateCredits } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  /**
   * LIKE FUNCTIONALITY - Backend Integration
   * TODO: Replace with API call to backend
   * 
   * API Endpoint: POST /api/interactions/like
   * Body: { target_user_id, interaction_type: 'like' }
   * 
   * Features to implement:
   * - Mutual match detection (both users liked each other)
   * - Real-time notifications for matches
   * - Daily like limits for free users
   * - Unlimited likes for premium users
   * - Track like analytics for recommendations
   */
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    toggleLikeProfile(profile.id);
    const isLiked = likedProfiles.includes(profile.id);
    
    toast({
      title: isLiked ? "Removed from Favorites" : "Added to Favorites",
      description: isLiked 
        ? `Removed ${profile.name} from your favorites` 
        : `Added ${profile.name} to your favorites!`
    });
  };

  /**
   * MESSAGE FUNCTIONALITY - Backend Integration
   * TODO: Replace with API call to backend
   * 
   * API Endpoint: POST /api/conversations/create
   * Body: { participant_id }
   * 
   * Features to implement:
   * - Credit validation before starting chat
   * - Conversation creation or retrieval
   * - Real-time conversation updates
   * - Premium user unlimited messaging
   * - Message preview generation
   */
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    // Add to chat conversations
    addChatConversation(profile);
    navigate(`/chat/${profile.id}`);
    
    toast({
      title: "Chat Opened",
      description: `You can now chat with ${profile.name}!`
    });
  };

  const isLiked = likedProfiles.includes(profile.id);

  return (
    <div className="bg-card rounded-xl shadow-elegant overflow-hidden border border-border hover:shadow-glow transition-all duration-300 w-full max-w-sm mx-auto">
      <div 
        className="relative aspect-square cursor-pointer group"
        onClick={onClick}
      >
        {profile.profilePicture ? (
          <img 
            src={profile.profilePicture} 
            alt={profile.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-6xl sm:text-7xl md:text-8xl group-hover:scale-105 transition-transform duration-300">
            {profile.avatar}
          </div>
        )}
        
        {/* Enhanced overlay with bio preview - responsive design */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-3 sm:p-4 text-white w-full">
            <p className="text-xs sm:text-sm leading-tight line-clamp-3 mb-2">{profile.bio}</p>
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 3).map((interest) => (
                <span key={interest} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
            {profile.name}, {profile.age}
          </h3>
          {profile.location && (
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleLike}
            variant={isLiked ? "default" : "outline"}
            size="sm"
            className={`h-9 text-sm ${
              isLiked 
                ? "bg-gradient-primary hover:opacity-90" 
                : "border-primary/20 hover:bg-primary/5"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current mr-2' : 'mr-2'}`} />
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </Button>
          <Button
            onClick={handleMessage}
            size="sm"
            className="h-9 text-sm bg-gradient-primary hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span>Chat</span>
          </Button>
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        type="message"
      />
    </div>
  );
};

export default ProfileCard;