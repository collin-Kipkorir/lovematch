import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmailAndPhone } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await loginWithEmailAndPhone(email.toLowerCase(), password);
      if (success) {
        toast({
          title: 'Success',
          description: 'Login successful!',
        });
        navigate('/home');
      } else {
        toast({
          title: 'Error',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-hero px-2 sm:px-4 md:px-6">
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
            className="absolute text-romance"
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

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg" // increased width for better balance
      >
        <Card className="shadow-romantic backdrop-blur-sm bg-card/80 rounded-2xl border border-border">
          <CardHeader className="space-y-1 text-center pb-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              className="flex justify-center"
            >
              <Heart className="h-8 w-8 text-primary drop-shadow-md" />
            </motion.div>
            <CardTitle className="text-3xl font-semibold text-foreground">
              Welcome Back 💕
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to continue your love story
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                  className="rounded-lg border-border focus:border-primary focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg border-border focus:border-primary focus:ring-primary/30"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg bg-primary hover:bg-primary/90 shadow-md text-primary-foreground"
              >
                Sign In
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don’t have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
