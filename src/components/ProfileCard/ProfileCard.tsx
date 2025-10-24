import React, { useState, useCallback, useRef, memo } from 'react';
import { Profile } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';

import ChatModal from '@/components/ChatModal';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

interface ProfileCardProps {
  profile: Profile;
  onClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick }) => {
  const { user, toggleLikeProfile, likedProfiles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedActionRef = useRef<NodeJS.Timeout>();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  
  const isLiked = likedProfiles.includes(profile.id);
  const distanceText = profile.location ? profile.location : 'Location not set';

  const formatTimeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  const debounce = useCallback((callback: () => Promise<void>) => {
    if (debouncedActionRef.current) {
      clearTimeout(debouncedActionRef.current);
    }
    if (isLoading) return;

    debouncedActionRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        await callback();
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [isLoading]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    // Update localStorage instantly
    const localKey = `favorites_${user.id}`;
    let localFavs: string[] = [];
    try {
      localFavs = JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch { localFavs = []; }

    let updatedFavs: string[];
    if (isLiked) {
      updatedFavs = localFavs.filter(id => id !== profile.id);
    } else {
      updatedFavs = [...localFavs, profile.id];
    }
    localStorage.setItem(localKey, JSON.stringify(updatedFavs));

    // Update UI state immediately
    toggleLikeProfile(profile.id);

    // Sync with Firebase in background
    debounce(async () => {
      try {
        const favoritesRef = ref(database, `userFavorites/${user.id}/${profile.id}`);
        if (isLiked) {
          await set(favoritesRef, null);
        } else {
          await set(favoritesRef, {
            id: profile.id,
            name: profile.name,
            profileImage: profile.profileImage,
            age: profile.age,
            location: profile.location,
            addedAt: new Date().toISOString()
          });
        }
        toast({
          title: isLiked ? 'Removed from Favorites' : 'Added to Favorites',
          description: isLiked
            ? `${profile.name}'s profile has been removed from your favorites`
            : `${profile.name}'s profile has been added to your favorites`,
          variant: isLiked ? 'default' : 'default',
          action: !isLiked ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/favorites')}>
              View Favorites
            </Button>
          ) : undefined
        });
      } catch (error) {
        console.error('Error updating favorites:', error);
        toast({
          title: "Error",
          description: "Failed to update favorites. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.credits <= 0) {
      setIsPaymentModalOpen(true);
      setIsChatModalOpen(false);
      return;
    }

    setIsPaymentModalOpen(false);
    // Ensure chat exists, then open modal
    debounce(async () => {
      try {
        const chatId = [user.id, profile.id].sort().join('_');
        const chatRef = ref(database, `chats/${chatId}`);
        const timestamp = new Date().toISOString();
        const snapshot = await get(chatRef);
        const chatExists = snapshot.exists();
        if (!chatExists) {
          await Promise.all([
            set(chatRef, {
              createdAt: timestamp,
              lastMessageAt: timestamp,
              participants: {
                [user.id]: {
                  id: user.id,
                  name: user.name,
                  profileImage: user.profileImage,
                  unreadCount: 0,
                  lastSeen: timestamp,
                  isActive: true
                },
                [profile.id]: {
                  id: profile.id,
                  name: profile.name,
                  profileImage: profile.profileImage,
                  unreadCount: 0,
                  lastSeen: null,
                  isActive: false
                }
              }
            }),
            update(ref(database, `userChats/${user.id}/${profile.id}`), {
              id: chatId,
              profileId: profile.id,
              name: profile.name,
              avatar: profile.profileImage,
              lastMessage: '',
              timestamp: timestamp,
              unread: 0
            }),
            update(ref(database, `userChats/${profile.id}/${user.id}`), {
              id: chatId,
              profileId: user.id,
              name: user.name,
              avatar: user.profileImage,
              lastMessage: '',
              timestamp: timestamp,
              unread: 0
            })
          ]);
        }
        setIsChatModalOpen(true);
      } catch (error) {
        console.error('Error creating chat:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <>
      <div 
        onClick={onClick} 
        className="group relative bg-card rounded-lg overflow-hidden cursor-pointer border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
      >
        {/* Profile Image with Hover Info Overlay */}
        <div className="relative aspect-[3/4] bg-gradient-to-b from-background/20 to-background/5">
          {(() => {
            let imgSrc = profile.profileImage;
            if (!imgSrc || typeof imgSrc !== 'string' || imgSrc.trim() === '' || imgSrc === 'undefined' || imgSrc === 'null') {
              imgSrc = '/placeholder.svg';
            }
            if (imgSrc) {
              return (
                <img 
                  src={imgSrc} 
                  alt={profile.name} 
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="high"
                />
              );
            } else {
              return (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <span className="text-4xl">👤</span>
                </div>
              );
            }
          })()}
          
          {/* Hover Info Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="text-white space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm line-clamp-3">{profile.bio}</p>
              <div className="flex flex-wrap gap-1">
                {profile.interests?.slice(0, 3).map((interest, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-white/20 rounded-full">{interest}</span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Online Status, Last Active & Verification */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {profile.isVerified && (
              <div className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center" title="Verified Profile">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="flex items-center gap-2 bg-background/80 rounded-full px-2 py-1">
              <div 
                className={cn(
                  "w-3 h-3 rounded-full border-2 border-background",
                  profile.isActive ? "bg-green-500 animate-pulse" : 
                  new Date().getTime() - new Date(profile.lastActive).getTime() < 12 * 60 * 60 * 1000 
                    ? "bg-green-500" 
                    : "bg-gray-400"
                )}
              />
              <span className="text-xs font-medium">
                {profile.isActive ? "Online" : formatTimeAgo(profile.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {profile.name}, {profile.age}
              </h3>
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {distanceText}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "flex-1 hover:bg-primary/10 hover:border-primary/30 transition-colors",
                isLiked && "bg-primary/10 border-primary text-primary"
              )}
              onClick={handleLike}
              disabled={isLoading}
            >
              <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-primary")} />
              {isLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 hover:bg-primary/10 hover:border-primary/30 transition-colors"
              onClick={handleMessage}
              disabled={isLoading}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Only one modal open at a time */}
      <PaymentModal 
        isOpen={isPaymentModalOpen && !isChatModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        type="message"
      />
      {/* Use the same ChatModal as chat list, always full height, dark, and with the same props */}
      <ChatModal
        open={isChatModalOpen && !isPaymentModalOpen}
        onOpenChange={setIsChatModalOpen}
        otherUserId={profile.id}
      />
    </>
  );
};

export default memo(ProfileCard);