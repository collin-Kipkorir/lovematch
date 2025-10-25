import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Upload } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    lookingFor: '',
    age: '',
    location: '',
    bio: '',
    interests: '',
    profileImage: '',
  });

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profileImage) {
      toast({
        title: "Error",
        description: "Please upload a profile picture",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email.toLowerCase(),
        password: formData.password,
        profileImage: formData.profileImage,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        lookingFor: formData.lookingFor as 'Male' | 'Female' | 'All',
        age: parseInt(formData.age),
        location: formData.location,
        bio: formData.bio,
        interests: formData.interests.split(',').map(i => i.trim()),
      });

      toast({
        title: "Success",
        description: "Registration successful! Please login.",
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-50 px-2 sm:px-4 md:px-6">
      {/* Floating Hearts */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1 }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-400"
            initial={{ y: 800, opacity: 0 }}
            animate={{
              y: -50,
              opacity: [0, 1, 0],
              x: [0, Math.random() * 50 - 25],
            }}
            transition={{
              repeat: Infinity,
              duration: 8 + Math.random() * 4,
              delay: i * 1,
            }}
          >
            <Heart className="w-5 h-5" />
          </motion.div>
        ))}
      </motion.div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-xl backdrop-blur-sm bg-white/90 rounded-2xl border border-pink-200">
          <CardHeader className="space-y-2 text-center pb-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="flex justify-center"
            >
              <Heart className="h-8 w-8 text-primary drop-shadow-md" />
            </motion.div>
            <CardTitle className="text-3xl font-semibold text-gray-900">
              Create Account 💞
            </CardTitle>
            <p className="text-sm text-gray-600">
              Find your perfect match today
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div
                  onClick={handleAvatarClick}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-32 h-32 border-2 border-primary">
                    <AvatarImage src={previewImage || undefined} />
                    <AvatarFallback className="bg-muted">
                      {uploading ? (
                        "Uploading..."
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 mb-2" />
                          <span className="text-sm">Add Photo</span>
                        </div>
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to upload profile picture
                </p>
              </div>

              {/* Basic Info Fields */}
              {[
                { id: 'name', label: 'Name', placeholder: 'Enter your name' },
                { id: 'email', label: 'Email', placeholder: 'Enter your email', type: 'email' },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id} className="text-gray-900 font-medium">{label}</Label>
                  <Input
                    id={id}
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={formData[id as keyof typeof formData] as string}
                    onChange={(e) =>
                      handleChange(id, id === 'email' ? e.target.value.toLowerCase() : e.target.value)
                    }
                    required
                    className="rounded-lg border-pink-200 focus:border-pink-400 focus:ring-pink-300"
                  />
                </div>
              ))}

              {/* Password Fields */}
              {[
                { id: 'password', label: 'Password', placeholder: 'Create a password' },
                { id: 'confirmPassword', label: 'Confirm Password', placeholder: 'Confirm your password' },
              ].map(({ id, label, placeholder }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id} className="text-gray-900 font-medium">{label}</Label>
                  <Input
                    id={id}
                    type="password"
                    placeholder={placeholder}
                    value={formData[id as keyof typeof formData] as string}
                    onChange={(e) => handleChange(id, e.target.value)}
                    required
                    className="rounded-lg border-pink-200 focus:border-pink-400 focus:ring-pink-300"
                  />
                </div>
              ))}

              {/* Gender and Preference */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 font-medium">I am a</Label>
                  <Select onValueChange={(value) => handleChange('gender', value)} required>
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

                <div className="space-y-2">
                  <Label className="text-gray-900 font-medium">Looking for</Label>
                  <Select onValueChange={(value) => handleChange('lookingFor', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="All">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Info */}
              {[
                { id: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age' },
                { id: 'location', label: 'Location', placeholder: 'Enter your location' },
                { id: 'bio', label: 'Bio', placeholder: 'Tell us about yourself' },
                { id: 'interests', label: 'Interests (comma-separated)', placeholder: 'e.g., music, travel, cooking' },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id} className="text-gray-900 font-medium">{label}</Label>
                  <Input
                    id={id}
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={formData[id as keyof typeof formData] as string}
                    onChange={(e) => handleChange(id, e.target.value)}
                    required
                    className="rounded-lg border-pink-200 focus:border-pink-400 focus:ring-pink-300"
                  />
                </div>
              ))}

              {/* Submit */}
              <Button type="submit" className="w-full rounded-lg bg-primary hover:bg-primary/90 shadow-md" disabled={uploading}>
                {uploading ? "Uploading Image..." : "Sign Up"}
              </Button>

              <div className="text-center text-sm text-gray-700">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
