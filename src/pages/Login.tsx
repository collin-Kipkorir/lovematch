import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/**
 * LOGIN PAGE - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace mock authentication with Supabase Auth
 * 
 * SUPABASE INTEGRATION STEPS:
 * 1. Install Supabase client: npm install @supabase/supabase-js
 * 2. Setup Supabase config in lib/supabase.ts
 * 3. Update AuthContext to use Supabase auth methods
 * 
 * AUTHENTICATION FLOW:
 * - Replace useAuth().login() with supabase.auth.signInWithPassword()
 * - Handle email verification if enabled
 * - Implement password reset functionality
 * - Add OAuth providers (Google, Facebook, etc.) if needed
 * 
 * DATABASE INTEGRATION:
 * - Create 'profiles' table in Supabase for user data
 * - Set up Row Level Security (RLS) policies
 * - Auto-create profile on user registration
 * 
 * ERROR HANDLING:
 * - Handle network errors
 * - Show specific error messages (invalid credentials, unverified email, etc.)
 * - Implement rate limiting for login attempts
 * 
 * SECURITY CONSIDERATIONS:
 * - Enable email confirmation
 * - Set up password strength requirements
 * - Implement session management
 * - Add CAPTCHA for failed attempts
 */

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(email, password)) {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in."
      });
      navigate('/');
    } else {
      toast({
        title: "Login failed",
        description: "Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card shadow-romantic">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-primary animate-pulse-glow" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome Back to LoveMatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all focus:shadow-romantic"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all focus:shadow-romantic"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary shadow-romantic hover:opacity-90">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;