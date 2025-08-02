import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/**
 * REGISTER PAGE - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace mock registration with Supabase Auth
 * 
 * SUPABASE INTEGRATION STEPS:
 * 1. Replace useAuth().register() with supabase.auth.signUp()
 * 2. Create user profile in 'profiles' table after successful registration
 * 3. Implement email verification flow
 * 4. Add profile picture upload functionality
 * 
 * DATABASE SCHEMA:
 * Table: profiles (auto-created after auth.users registration)
 * - id (uuid, primary key, foreign key to auth.users.id)
 * - name (text, not null)
 * - age (integer, check constraint: age >= 18)
 * - gender (enum: 'male', 'female', 'other')
 * - looking_for (enum: 'male', 'female', 'all')
 * - location (text)
 * - bio (text)
 * - interests (text[] array)
 * - profile_pictures (text[] array of URLs)
 * - is_verified (boolean, default false)
 * - is_premium (boolean, default false)
 * - credits (integer, default 5)
 * - video_credits (integer, default 0)
 * - created_at (timestamp, default now())
 * - updated_at (timestamp, default now())
 * 
 * FEATURES TO IMPLEMENT:
 * - Email verification before profile activation
 * - Profile picture upload with image compression
 * - Interest suggestions based on categories
 * - Location autocomplete using Google Places API
 * - Age verification (18+ requirement)
 * - Username availability check
 * - Social media account linking
 * - Phone number verification (optional)
 * 
 * VALIDATION:
 * - Email format validation
 * - Password strength requirements
 * - Profanity filter for bio and name
 * - Image content moderation
 * - Duplicate account prevention
 * 
 * ONBOARDING FLOW:
 * - Welcome email with app features
 * - Profile completion prompts
 * - Matching preferences setup
 * - Initial credit allocation
 * - Tutorial for app usage
 */

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    lookingFor: '',
    age: '',
    location: '',
    bio: '',
    interests: ''
  });

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.gender || !formData.lookingFor || !formData.age) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    register({
      name: formData.name,
      email: formData.email,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      lookingFor: formData.lookingFor as 'Male' | 'Female' | 'All',
      age: parseInt(formData.age),
      location: formData.location,
      bio: formData.bio,
      interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean)
    });

    toast({
      title: "Welcome to LoveMatch!",
      description: "Your account has been created. You have 5 free message credits!"
    });
    
    navigate('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-card shadow-romantic">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary animate-pulse-glow" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Join LoveMatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Looking for *</Label>
                <Select value={formData.lookingFor} onValueChange={(value) => handleInputChange('lookingFor', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Looking for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="All">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="interests">Interests</Label>
              <Input
                id="interests"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                placeholder="travel, food, music (comma separated)"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary shadow-romantic hover:opacity-90">
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;