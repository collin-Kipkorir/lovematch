import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Users, MessageCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-romance/20 to-passion/20 animate-gradient-shift"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-romance/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-passion/10 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20 text-center z-10">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced heart icon with floating elements */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 animate-pulse-glow"></div>
                <Heart className="relative h-28 w-28 text-white drop-shadow-2xl animate-pulse-glow" />
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 bg-passion rounded-full animate-ping shadow-glow"></div>
                  <div className="absolute inset-0 w-8 h-8 bg-passion/50 rounded-full animate-pulse"></div>
                </div>
                {/* Floating hearts */}
                <Heart className="absolute -top-4 -left-6 h-4 w-4 text-romance/60 animate-bounce fill-current" style={{animationDelay: '0.5s'}} />
                <Heart className="absolute -bottom-2 -right-8 h-3 w-3 text-passion/40 animate-bounce fill-current" style={{animationDelay: '1s'}} />
                <Heart className="absolute top-8 -left-8 h-5 w-5 text-white/30 animate-bounce fill-current" style={{animationDelay: '1.5s'}} />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight">
              Find Your
              <span className="block bg-gradient-to-r from-romance via-passion to-romance bg-clip-text text-transparent animate-gradient-shift bg-300% drop-shadow-lg"> Soulmate</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/95 mb-6 font-light tracking-wide">
              Where real love stories begin ✨
            </p>
            
            <p className="text-xl text-white/80 mb-16 max-w-3xl mx-auto leading-relaxed">
              Join thousands of singles who found their perfect match through our intelligent matchmaking platform. Your love story is waiting to be written.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto">
              <Button 
                onClick={() => navigate('/register')}
                size="lg"
                className="group bg-white text-primary hover:bg-white/95 font-bold text-xl px-10 py-6 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                <span className="mr-2">Start Your Journey</span>
                <Heart className="h-5 w-5 group-hover:fill-current transition-all duration-300" />
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className="border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 font-semibold text-xl px-10 py-6 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-16 flex justify-center items-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>10,000+ Happy Couples</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>100% Free to Start</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-white/5 backdrop-blur-sm py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-romance/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-passion/10 rounded-full blur-2xl"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-romance to-passion bg-clip-text text-transparent">LoveMatch</span>?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Experience the future of dating with our cutting-edge features
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-glow">
              <div className="relative w-20 h-20 bg-gradient-to-br from-romance/30 to-romance/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-10 w-10 text-white group-hover:fill-current transition-all duration-300" />
                <div className="absolute inset-0 bg-romance/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-romance transition-colors duration-300">Smart Matching</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Our advanced AI algorithm finds your perfect match based on deep compatibility, shared interests, and core values.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-glow">
              <div className="relative w-20 h-20 bg-gradient-to-br from-passion/30 to-passion/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10 text-white" />
                <div className="absolute inset-0 bg-passion/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-passion transition-colors duration-300">Real People</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Connect with genuine, verified profiles of singles who are serious about finding meaningful, lasting relationships.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-glow">
              <div className="relative w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-10 w-10 text-white" />
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors duration-300">Easy Communication</h3>
              <p className="text-white/80 text-lg leading-relaxed">
                Break the ice effortlessly with our intuitive chat system and AI-powered conversation starters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="relative py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-romance/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-passion/10 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Love Stories That <span className="bg-gradient-to-r from-romance to-passion bg-clip-text text-transparent">Inspire</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Real couples, real happiness, real forever
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-6">
                <div className="flex text-yellow-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className="h-5 w-5 fill-current drop-shadow-sm" />
                  ))}
                </div>
                <div className="text-romance font-semibold text-sm bg-romance/10 px-3 py-1 rounded-full">
                  💑 Married
                </div>
              </div>
              <p className="text-white/95 mb-6 italic text-lg leading-relaxed">
                "I found my perfect match within two weeks! The platform really understands what you're looking for. We're getting married next month and couldn't be happier!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-romance to-passion rounded-full flex items-center justify-center text-white font-bold">
                  S&J
                </div>
                <div>
                  <div className="font-semibold text-white">Sarah & James</div>
                  <div className="text-white/60 text-sm">Together for 1 year</div>
                </div>
              </div>
            </div>
            
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-6">
                <div className="flex text-yellow-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className="h-5 w-5 fill-current drop-shadow-sm" />
                  ))}
                </div>
                <div className="text-passion font-semibold text-sm bg-passion/10 px-3 py-1 rounded-full">
                  💕 Dating
                </div>
              </div>
              <p className="text-white/95 mb-6 italic text-lg leading-relaxed">
                "After years of failed dates, LoveMatch helped me find someone who truly gets me. We've been together for 8 months and I've never been happier!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-passion to-primary rounded-full flex items-center justify-center text-white font-bold">
                  M&E
                </div>
                <div>
                  <div className="font-semibold text-white">Michael & Emma</div>
                  <div className="text-white/60 text-sm">Together for 8 months</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-romance/20 via-passion/20 to-primary/20 backdrop-blur-sm py-24 overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-0 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-pulse-subtle" style={{animationDelay: '1s'}}></div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Find <span className="bg-gradient-to-r from-romance via-passion to-romance bg-clip-text text-transparent">Love</span>?
            </h2>
            <p className="text-2xl text-white/95 mb-4 font-light">
              Your soulmate is waiting for you ✨
            </p>
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of happy couples who found their perfect match on LoveMatch. Your love story starts with a single click.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto mb-12">
              <Button 
                onClick={() => navigate('/register')}
                size="lg"
                className="group bg-white text-primary hover:bg-white/95 font-bold text-2xl px-12 py-8 shadow-glow hover:shadow-elegant transition-all duration-300 hover:scale-110 animate-pulse-subtle"
              >
                <span className="mr-3">Join Now - It's Free!</span>
                <Heart className="h-6 w-6 group-hover:fill-current transition-all duration-300" />
              </Button>
            </div>
            
            {/* Social proof */}
            <div className="flex justify-center items-center gap-8 text-white/70 text-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-glow"></div>
                <span className="font-semibold">10,000+ Matches Made</span>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-glow"></div>
                <span className="font-semibold">100% Safe & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;