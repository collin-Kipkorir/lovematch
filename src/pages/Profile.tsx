import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Layout/Header';
import BottomNav from '@/components/Navigation/BottomNav';
import EditProfileModal from '@/components/EditProfileModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, MessageCircle, Settings, Edit } from 'lucide-react';

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

  if (!user) {
    return null;
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
                    src={user.profileImage || user.images?.[0] || '/placeholder.svg'}
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

          {/* Credits - Hide for admin/moderator users since they don't purchase credits */}
          {user.id !== 'admin' && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-background/80 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Message Credits</p>
                        <p className="text-xs text-muted-foreground">For messaging</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">{user.credits}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-background to-background/80 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <span className="text-lg">📹</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Video Credits</p>
                        <p className="text-xs text-muted-foreground">For video calls</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-secondary-foreground">{user.videoCredits}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      
      <BottomNav />
    </div>
  );
};

export default Profile;