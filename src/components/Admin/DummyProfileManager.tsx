import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Calendar,
  MapPin,
  Heart,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dummyProfiles } from '@/data/adminData';
import { DummyProfile } from '@/types/admin';

const DummyProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<DummyProfile[]>(dummyProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DummyProfile | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    age: 25,
    gender: 'Female' as DummyProfile['gender'],
    bio: '',
    interests: [] as string[],
    location: '',
    avatar: ''
  });

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || profile.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Removed - functionality moved to handleSaveProfile

  const handleToggleActive = (profileId: string) => {
    setProfiles(profiles.map(profile =>
      profile.id === profileId ? { ...profile, isActive: !profile.isActive } : profile
    ));
    
    const profile = profiles.find(p => p.id === profileId);
    toast({
      title: `Profile ${profile?.isActive ? 'Deactivated' : 'Activated'}`,
      description: `${profile?.name} is now ${profile?.isActive ? 'hidden' : 'visible'} to users`,
    });
  };

  const handleEditProfile = (profile: DummyProfile) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      interests: [...profile.interests],
      location: profile.location,
      avatar: profile.avatar
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (editingProfile) {
      // Update existing profile
      setProfiles(profiles.map(p => 
        p.id === editingProfile.id 
          ? { ...p, ...newProfile }
          : p
      ));
      toast({
        title: "Profile Updated",
        description: `${newProfile.name} has been updated`,
      });
    } else {
      // Create new profile
      const profile: DummyProfile = {
        id: `dummy-${Date.now()}`,
        ...newProfile,
        isActive: true,
        createdBy: 'admin-1', // Current admin
        createdAt: new Date().toISOString()
      };
      setProfiles([...profiles, profile]);
      toast({
        title: "Profile Created",
        description: `${profile.name} has been added to the platform`,
      });
    }
    
    // Reset form
    setNewProfile({
      name: '',
      age: 25,
      gender: 'Female',
      bio: '',
      interests: [],
      location: '',
      avatar: ''
    });
    setEditingProfile(null);
    setIsCreateModalOpen(false);
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    setProfiles(profiles.filter(p => p.id !== profileId));
    
    toast({
      title: "Profile Deleted",
      description: `${profile?.name} has been removed`,
      variant: "destructive"
    });
  };

  const addInterest = (interest: string) => {
    if (interest && !newProfile.interests.includes(interest)) {
      setNewProfile({
        ...newProfile,
        interests: [...newProfile.interests, interest]
      });
    }
  };

  const removeInterest = (interest: string) => {
    setNewProfile({
      ...newProfile,
      interests: newProfile.interests.filter(i => i !== interest)
    });
  };

  const commonInterests = [
    'Travel', 'Photography', 'Cooking', 'Music', 'Fitness', 'Reading',
    'Movies', 'Hiking', 'Art', 'Technology', 'Sports', 'Dancing',
    'Yoga', 'Gaming', 'Coffee', 'Wine', 'Fashion', 'Writing'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dummy Profile Manager</h2>
          <p className="text-muted-foreground">
            Create and manage fake profiles for user engagement
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setEditingProfile(null);
            setNewProfile({
              name: '',
              age: 25,
              gender: 'Female',
              bio: '',
              interests: [],
              location: '',
              avatar: ''
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create Dummy Profile'}</DialogTitle>
              <DialogDescription>
                {editingProfile ? 'Update the profile information' : 'Create a new fake profile to engage with real users'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="80"
                    value={newProfile.age}
                    onChange={(e) => setNewProfile({ ...newProfile, age: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newProfile.gender} onValueChange={(value: DummyProfile['gender']) => 
                    setNewProfile({ ...newProfile, gender: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    value={newProfile.location}
                    onChange={(e) => setNewProfile({ ...newProfile, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={newProfile.avatar}
                  onChange={(e) => setNewProfile({ ...newProfile, avatar: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Write an engaging bio..."
                  value={newProfile.bio}
                  onChange={(e) => setNewProfile({ ...newProfile, bio: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newProfile.interests.map((interest) => (
                    <Badge 
                      key={interest} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => removeInterest(interest)}
                    >
                      {interest} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonInterests
                    .filter(interest => !newProfile.interests.includes(interest))
                    .map((interest) => (
                    <Badge 
                      key={interest} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => addInterest(interest)}
                    >
                      + {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  {editingProfile ? 'Update Profile' : 'Create Profile'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <Avatar className="w-full h-48 rounded-none">
                  <AvatarImage src={profile.avatar} className="object-cover" />
                  <AvatarFallback className="w-full h-48 rounded-none text-2xl">
                    {profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute top-2 right-2">
                  <Switch 
                    checked={profile.isActive}
                    onCheckedChange={() => handleToggleActive(profile.id)}
                  />
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant={profile.isActive ? "default" : "secondary"}>
                    {profile.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <span className="text-sm text-muted-foreground">{profile.age}</span>
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profile.location}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {profile.bio}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.interests.slice(0, 3).map((interest) => (
                    <Badge key={interest} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {profile.interests.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.interests.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {Math.floor(Math.random() * 50 + 10)} matches
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditProfile(profile)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground mb-4">
              No dummy profiles match your search criteria
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DummyProfileManager;