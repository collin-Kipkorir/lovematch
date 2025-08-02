import React, { useState } from 'react';
import { Profile } from '@/data/dummyProfiles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, MapPin, Heart, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';

/**
 * PROFILE MODAL COMPONENT - BACKEND INTEGRATION GUIDE
 * 
 * DATABASE SCHEMA:
 * Table: user_profiles (same as ProfileCard)
 * Table: user_interactions (same as ProfileCard)
 * 
 * Table: video_calls
 * - id (uuid, primary key)
 * - caller_id (uuid, foreign key to auth.users)
 * - callee_id (uuid, foreign key to auth.users)
 * - call_duration (integer) - in seconds
 * - call_status (enum: 'initiated', 'answered', 'rejected', 'ended', 'missed')
 * - credits_used (integer)
 * - created_at (timestamp)
 * - ended_at (timestamp)
 * 
 * FEATURES TO IMPLEMENT:
 * - Video call integration with WebRTC or Agora/Twilio
 * - Credit-based video calling system
 * - Call history and analytics
 * - Call quality feedback
 * - Emergency/safety features during calls
 * - Screen recording prevention
 * - Background blur/filters
 * - Call duration limits based on credits
 */

interface ProfileModalProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, isOpen, onClose }) => {
  const { user, updateCredits, updateVideoCredits, likedProfiles, toggleLikeProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'message' | 'video'>('message');

  if (!profile) return null;

  /**
   * MESSAGE FUNCTIONALITY - Backend Integration
   * TODO: Replace with API call to create/retrieve conversation
   * 
   * API Endpoint: POST /api/conversations/create
   * Features: Credit validation, conversation management, real-time updates
   */
  const handleMessage = () => {
    if (!user) return;

    navigate(`/chat/${profile.id}`);
    onClose();
    toast({
      title: "Chat Opened",
      description: `You can now chat with ${profile.name}!`
    });
  };

  /**
   * VIDEO CALL FUNCTIONALITY - Backend Integration
   * TODO: Replace with WebRTC/Agora/Twilio integration
   * 
   * API Endpoints:
   * - POST /api/video-calls/initiate
   * - GET /api/video-calls/{callId}/token
   * - PUT /api/video-calls/{callId}/end
   * 
   * Features: Credit validation, call recording, safety features
   */
  const handleVideoCall = () => {
    if (!user) return;
    
    if (user.videoCredits <= 0) {
      setPaymentType('video');
      setIsPaymentModalOpen(true);
      return;
    }

    updateVideoCredits(-1);
    toast({
      title: "Video Call Started",
      description: `Starting video call with ${profile.name}!`
    });
    
    // TODO: Replace with actual video call implementation
    setTimeout(() => {
      toast({
        title: "Video Call Ended",
        description: "Thank you for using our video chat service!"
      });
    }, 3000);
  };

  /**
   * LIKE FUNCTIONALITY - Backend Integration
   * TODO: Replace with API call for mutual match detection
   * 
   * API Endpoint: POST /api/interactions/like
   * Features: Mutual match notifications, daily limits, analytics
   */
  const handleLike = () => {
    if (!user || !profile) return;
    
    toggleLikeProfile(profile.id);
    const isLiked = likedProfiles.includes(profile.id);
    
    toast({
      title: isLiked ? "Removed from Favorites" : "Added to Favorites",
      description: isLiked 
        ? `Removed ${profile.name} from your favorites` 
        : `Added ${profile.name} to your favorites!`
    });
  };

  const isLiked = profile ? likedProfiles.includes(profile.id) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">Profile Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Enhanced profile header - responsive */}
          <div className="text-center">
            {profile.profilePicture ? (
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src={profile.profilePicture} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-6xl sm:text-8xl mb-4">{profile.avatar}</div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{profile.age} years old</p>
            {profile.location && (
              <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Enhanced about section */}
          <div>
            <h3 className="font-semibold mb-2 text-foreground text-base sm:text-lg">About</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Enhanced interests section */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground text-base sm:text-lg">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced action buttons - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={handleLike}
              variant={isLiked ? "default" : "outline"}
              size="default"
              className={`h-11 ${isLiked 
                ? "bg-gradient-primary hover:opacity-90" 
                : "border-primary/20 hover:bg-primary/5"
              }`}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              onClick={handleMessage}
              size="default"
              className="bg-gradient-primary hover:opacity-90 h-11"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              onClick={handleVideoCall}
              size="default"
              variant="secondary"
              className="bg-accent hover:bg-accent/80 h-11"
            >
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
          </div>

        </div>
        
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          type={paymentType}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;