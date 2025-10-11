import React, { useMemo, useState } from 'react';
import { Profile as RealProfile } from '@/hooks/useProfiles';
import { Profile as DummyProfile } from '@/data/dummyProfiles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, MapPin, Heart, Video, Gift as GiftIcon, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';

// ==========================
// Single-file Profile Modal
// - Clean UI (Tailwind + shadcn style components)
// - Gifting feature (TikTok-like) with multiple gifts and costs
// - Gift purchasing flow stubbed for backend integration
// ==========================

type Profile = RealProfile | DummyProfile;

interface ProfileModalProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

// Example gifting catalogue — you can load this from backend or admin panel
const GIFT_CATALOG = [
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 10, description: 'Send a sweet rose' },
  { id: 'choco', name: 'Chocolate', emoji: '🍫', cost: 15, description: 'A tasty treat' },
  { id: 'spark', name: 'Spark', emoji: '✨', cost: 25, description: 'Show big appreciation' },
  { id: 'crown', name: 'Crown', emoji: '👑', cost: 50, description: 'VIP-level gift' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', cost: 100, description: 'Massive love boost' },
  { id: 'heart', name: 'Heart', emoji: '❤️', cost: 150, description: 'Express true love' },
  { id: 'plane', name: 'Plane', emoji: '✈️', cost: 200, description: 'Premium gift' },
  { id: 'lion', name: 'Lion', emoji: '🦁', cost: 500, description: 'Ultimate VIP gift', isPremium: true }
];

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, isOpen, onClose }) => {
  const { user, updateCredits, likedProfiles, toggleLikeProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'message' | 'video' | 'credits'>('message');

  // Gift state
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<typeof GIFT_CATALOG[number] | null>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [isSendingGift, setIsSendingGift] = useState(false);

  // compute total cost for chosen gift
  const giftTotal = useMemo(() => {
    if (!selectedGift) return 0;
    return selectedGift.cost * Math.max(1, giftQuantity);
  }, [selectedGift, giftQuantity]);

  if (!profile) return null;

  const isLiked = profile ? likedProfiles.includes(profile.id) : false;

  // -----------------------
  // Action handlers (stubs + UX)
  // -----------------------
  const handleMessage = () => {
    if (!user) return;
    navigate(`/chat/${profile.id}`);
    onClose();
    toast({ title: 'Chat Opened', description: `You can now chat with ${profile.name}!` });
  };

  const handleVideoCall = () => {
    if (!user) return;
    
    // Always show payment modal for video calls
    setPaymentType('video');
    setIsPaymentModalOpen(true);
  };

  const handleLike = () => {
    if (!user || !profile) return;
    toggleLikeProfile(profile.id);
    const liked = likedProfiles.includes(profile.id);
    toast({ title: liked ? 'Removed from Favorites' : 'Added to Favorites', description: liked ? `Removed ${profile.name} from your favorites` : `Added ${profile.name} to your favorites!` });
  };

  // -----------------------
  // Gifting flow
  // - open gift modal -> select gift & quantity -> confirm -> attempt purchase
  // - hook this to real payments or credits system (backend integration notes below)
  // -----------------------
  const openGift = () => {
    setIsGiftOpen(true);
    setSelectedGift(GIFT_CATALOG[0]);
    setGiftQuantity(1);
  };

  const confirmGift = async () => {
    if (!user || !selectedGift) return;
    setIsSendingGift(true);

    // If using credit system
    if (user.credits < giftTotal) {
      // Not enough credits — redirect to payment/credits top-up
      setIsSendingGift(false);
      setPaymentType('credits');
      setIsPaymentModalOpen(true);
      return;
    }

    try {
      // 1) Optimistic UI: deduct credits locally (use context/provider to persist)
      updateCredits(-giftTotal);

      // 2) Backend call: register gift transaction, notify recipient, analytics
      // TODO: Replace with real API call
      // await api.sendGift({ from: user.id, to: profile.id, giftId: selectedGift.id, quantity: giftQuantity, totalCost: giftTotal });

      // 3) Provide UX feedback
      toast({ title: 'Gift Sent!', description: `${selectedGift.emoji} ${selectedGift.name} x${giftQuantity} sent to ${profile.name}.` });
      setIsGiftOpen(false);
      setSelectedGift(null);

      // Optionally: record activity to user_interactions & send push notification via cloud function

    } catch (err) {
      // Revert optimistic deduction on error
      updateCredits(giftTotal);
      toast({ title: 'Gift Failed', description: 'There was an error sending your gift. Please try again.' });
    } finally {
      setIsSendingGift(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl">Profile</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Left: Avatar & quick stats */}
          <div className="col-span-1 flex flex-col items-center space-y-3">
            <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-lg ring-2 ring-primary/20 group">
              {profile.profileImage || profile.images?.[0] || profile.image ? (
                <img 
                  src={profile.profileImage || profile.images?.[0] || profile.image} 
                  alt={profile.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                    target.onerror = null;
                  }}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-4xl">
                  {typeof profile.name === 'string' && profile.name.trim() ? profile.name[0].toUpperCase() : 'U'}
                </div>
              )}
              {/* Verified Badge */}
              <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full shadow-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <h2 className="font-bold text-lg">
                  {profile.name}, <span className="font-normal">{profile.age}</span>
                </h2>
                <span className="text-primary" title="Verified Profile">✓</span>
              </div>
              {profile.location && (
                <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" /> {profile.location}
                </div>
              )}
            </div>

            <div className="w-full rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last active</span>
                <span>1d ago</span>
              </div>
            
            </div>

            {/* Gifting CTA */}
            <div className="w-full">
              <Button onClick={openGift} className="w-full mt-2 flex items-center justify-center">
                <GiftIcon className="h-4 w-4 mr-2" /> Send Gift
              </Button>
            </div>

            {/* quick actions small */}
            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={handleLike} 
                className={`p-2 rounded-md border ${isLiked ? 'bg-gradient-primary text-white' : 'hover:bg-muted'}`}
                title={isLiked ? "Remove from favorites" : "Add to favorites"}
                aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className="h-4 w-4" />
              </button>
              <button 
                onClick={handleMessage} 
                className="p-2 rounded-md border hover:bg-muted"
                title="Send message"
                aria-label="Send message"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button 
                onClick={handleVideoCall} 
                className="p-2 rounded-md border hover:bg-muted"
                title="Start video call"
                aria-label="Start video call"
              >
                <Video className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right: Details, bio and interests */}
          <div className="col-span-2 space-y-4">
            <section className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-sm mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio || 'No bio provided yet.'}</p>
            </section>

            <section className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 text-xs">{i}</Badge>
                ))}
              </div>
            </section>

            <section className="bg-card p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-sm mb-2">More</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border hover:shadow">🎵 Top interest: {profile.interests[0] || '—'}</div>
                <div className="p-3 rounded-lg border hover:shadow bg-primary/5">
                  <span className="flex items-center gap-1">
                    ⭐ Verified: <span className="text-primary font-medium">Yes</span>
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Gift Modal (TikTok-style UI) */}
        {isGiftOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="absolute inset-0 bg-black/40 -z-10" onClick={() => setIsGiftOpen(false)} />
            <div className="bg-gradient-to-b from-background/95 to-background border-t border-primary/10 backdrop-blur-sm rounded-t-3xl shadow-2xl">
              {/* Header */}
              <div className="relative flex items-center justify-center pt-6 pb-4">
                <div className="w-12 h-1 absolute -top-0 bg-muted-foreground/20 rounded-full" />
                <div>
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Send a Gift to {profile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground text-center mt-1">Make their day special!</p>
                </div>
                <button 
                  onClick={() => setIsGiftOpen(false)} 
                  className="absolute right-4 p-2 rounded-full hover:bg-primary/10 text-muted-foreground transition-colors"
                  title="Close gift selection"
                  aria-label="Close gift selection"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Gift Grid */}
              <div className="px-4 pb-4 overflow-x-auto pt-5">
                <div className="grid grid-flow-col auto-cols-[65px] sm:auto-cols-[85px] gap-2 sm:gap-3">
                  {GIFT_CATALOG.map((gift) => (
                    <div 
                      key={gift.id} 
                      onClick={() => setSelectedGift(gift)} 
                      className={`relative group cursor-pointer transition-all duration-300 ${
                        selectedGift?.id === gift.id 
                          ? 'scale-105 -translate-y-1' 
                          : 'hover:scale-105 hover:-translate-y-1'
                      }`}
                    >
                      <div className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br relative ${
                        selectedGift?.id === gift.id
                          ? gift.isPremium 
                            ? 'from-yellow-500/20 to-amber-500/10 ring-2 ring-yellow-500 shadow-lg'
                            : 'from-primary/20 to-primary/5 ring-2 ring-primary shadow-lg'
                          : gift.isPremium
                            ? 'from-yellow-500/10 to-amber-500/5 hover:from-yellow-500/20 hover:to-amber-500/10'
                            : 'from-muted/50 to-muted/30 hover:from-primary/10 hover:to-primary/5'
                      }`}>
                        {gift.isPremium && (
                          <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium animate-pulse shadow-lg">
                            VIP
                          </div>
                        )}
                        <div className={`text-2xl transform group-hover:scale-110 transition-transform duration-300 ${
                          gift.isPremium ? 'animate-pulse' : ''
                        }`}>
                          {gift.emoji}
                        </div>
                        <div className="text-[11px] font-medium text-center leading-tight">{gift.name}</div>
                        <div className={`text-[10px] font-semibold ${
                          gift.isPremium 
                            ? 'bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent'
                            : 'text-primary'
                        }`}>
                          {gift.cost} 💎
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="border-t border-primary/10 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantity</span>
                    <div className="flex items-center bg-muted/30 rounded-full">
                      <button 
                        onClick={() => setGiftQuantity(q => Math.max(1, q - 1))} 
                        className="p-2 hover:bg-primary/10 rounded-l-full transition-colors w-10 text-muted-foreground hover:text-primary"
                      >
                        -
                      </button>
                      <div className="w-12 text-center font-medium">{giftQuantity}</div>
                      <button 
                        onClick={() => setGiftQuantity(q => Math.min(99, q + 1))} 
                        className="p-2 hover:bg-primary/10 rounded-r-full transition-colors w-10 text-muted-foreground hover:text-primary"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground">Total Cost</div>
                    <div className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {giftTotal} 💎
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => setIsGiftOpen(false)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmGift} 
                    disabled={!selectedGift || isSendingGift} 
                    className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    {isSendingGift ? 'Sending...' : selectedGift ? `Send ${selectedGift.emoji}` : 'Select a gift'}
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground bg-primary/5 p-2 rounded-lg">
                  💝 Gifts boost your match score and can be converted to rewards!
                </div>
              </div>
            </div>
          </div>
        )}

        <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} type={paymentType} />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

/*
  Integration notes (backend):
  - Store gift catalogue on the server so you can change prices dynamically.
  - Implement an endpoint: POST /api/gifts/send { from, to, giftId, quantity, totalCost }
    - Validate sender credits, deduct on server, create gift transaction record.
    - Notify recipient via push (FCM) and add to recipient's activity feed.
  - Keep an audit table user_gifts (id, from, to, gift_id, qty, total_cost, created_at)
  - Consider conversion rules: creators can convert gifts to rewards/coins (withdrawal limits, fees).
  - WebSocket or Realtime DB: broadcast gift animation to recipient if online.
*/
