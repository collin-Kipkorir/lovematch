import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import EditProfileModal from '@/components/EditProfileModal';
import GiftWithdrawalModal from '@/components/GiftWithdrawalModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, MessageCircle, Settings, Edit, Gift, CreditCard } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';

/**
 * PROFILE PAGE - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Connect to real user profile data and settings
 * 
 * USER PROFILE DATA:
 * - Fetch from profiles table using current user ID
 * - Handle profile image uploads to Supabase Storage
 * - Update profile data in real-time
 * 
 * PROFILE PICTURES:
 * Storage: supabase.storage.from('profile-pictures')
 * - Upload multiple images (max 6-9 photos)
 * - Image compression/optimization
 * - CDN delivery for fast loading
 * - Delete old images when updating
 * 
 * PROFILE VERIFICATION:
 * - ID verification process
 * - Photo verification (selfie matching)
 * - Phone number verification
 * - Social media verification
 * 
 * CREDIT SYSTEM:
 * Table: user_credits
 * - user_id (uuid)
 * - message_credits (integer)
 * - video_credits (integer)
 * - updated_at (timestamp)
 * 
 * Table: credit_transactions
 * - id (uuid)
 * - user_id (uuid)
 * - transaction_type ('purchase', 'usage', 'bonus', 'refund')
 * - credit_type ('message', 'video')
 * - amount (integer)
 * - description (text)
 * - created_at (timestamp)
 * 
 * SETTINGS INTEGRATION:
 * - Privacy settings (profile visibility, last seen)
 * - Notification preferences
 * - Account preferences
 * - Blocking/reporting management
 * - Data export/deletion (GDPR compliance)
 * 
 * PROFILE ANALYTICS:
 * - Profile views tracking
 * - Like/match statistics
 * - Response rate metrics
 * - Profile completion score
 */

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [totalGifts, setTotalGifts] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    try {
      // Set up real-time listener for gifts
      const giftsRef = ref(database, 'userGifts');
      const userGiftsQuery = query(giftsRef, orderByChild('toUserId'), equalTo(user.id));
      
      const giftListener = onValue(userGiftsQuery, (snapshot) => {
        try {
          let totalValue = 0;
          
          snapshot.forEach((childSnapshot) => {
            const gift = childSnapshot.val();
            // Include all gifts in total, with fallback values
            const cost = gift.cost || 1;
            const quantity = gift.quantity || 1;
            totalValue += (cost * quantity);
          });
          
          setTotalGifts(totalValue);
        } catch (error) {
          console.error('Error processing gift data:', error);
          setTotalGifts(0); // Reset to safe value on error
        }
      }, (error) => {
        console.error('Error fetching gifts:', error);
        setTotalGifts(0);
      });

      // Cleanup listener on unmount
      return () => {
        off(userGiftsQuery);
      };
    } catch (error) {
      console.error('Error setting up gift listener:', error);
      setTotalGifts(0);
    }
  }, [user?.id]); // Only depend on user.id instead of entire user object

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Loading Profile...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-card/50 border-border/50">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/70 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"></div>
                  <img
                    src={user.profileImage || '/placeholder.svg'}
                    alt={user.name}
                    className="relative w-28 h-28 rounded-full object-cover border-4 border-background shadow-xl"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-border hover:border-primary/50 shadow-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{user.name}</h1>
                  <p className="text-lg text-muted-foreground font-medium">{user.age} years old</p>
                  {user.location && (
                    <div className="flex items-center justify-center space-x-2 mt-3 p-2 rounded-full bg-background/50 border border-border/30">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground font-medium">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-primary to-primary/70 rounded-full" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed text-base">{user.bio}</p>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {user.interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 rounded-lg bg-background/50 border border-border/30">
                  <span className="text-muted-foreground font-medium">Looking for:</span>
                  <span className="font-semibold text-foreground">{user.lookingFor}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 rounded-lg bg-background/50 border border-border/30">
                  <span className="text-muted-foreground font-medium">Gender:</span>
                  <span className="font-semibold text-foreground">{user.gender}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits and Gifts - Hide for admin/moderator users */}
          {user.id !== 'admin' && (
            <>
              <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    Credits Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-background/80 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Credits</p>
                        <p className="text-xs text-muted-foreground">Available for use</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">{user.credits}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-primary" />
                    </div>
                    Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-background/80 rounded-xl border border-border/50 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Gift Balance</p>
                          <p className="text-xs text-muted-foreground">
                            {totalGifts >= 1000 
                              ? "Eligible for withdrawal" 
                              : `${1000 - totalGifts} more needed to withdraw`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <span className="text-2xl font-bold text-primary">{totalGifts}</span>
                          <span className="text-sm text-muted-foreground ml-1">gifts</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Earnings: <span className="font-semibold text-primary">KSH {Math.floor(totalGifts / 2).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {totalGifts >= 1000 && (
                      <Button 
                        onClick={() => setIsWithdrawalModalOpen(true)}
                        className="w-full bg-gradient-to-r from-primary to-primary/90"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Withdraw KSH {Math.floor(totalGifts / 2).toLocaleString()}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-12 bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 text-primary hover:text-primary transition-all duration-200"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
            
            {user.id !== 'admin' && totalGifts >= 1000 && (
              <Button
                className="h-12 bg-gradient-to-r from-primary to-primary/90"
                onClick={() => setIsWithdrawalModalOpen(true)}
              >
                <Gift className="h-5 w-5 mr-2" />
                Withdraw Gifts ({totalGifts})
              </Button>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <GiftWithdrawalModal 
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        totalGifts={totalGifts}
        userId={user.id}
      />
      
      <BottomNav />
    </div>
  );
};

export default Profile;