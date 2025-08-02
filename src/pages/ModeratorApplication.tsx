import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';

// TODO: Backend Implementation Guide
// 1. Create moderator_applications table with fields:
//    - id, full_name, email, phone, age, location, languages, experience_years, 
//    - experience_description, motivation, availability, referred_by, referral_code, 
//    - status, created_at, updated_at
//
// 2. Create referrals table to track referral relationships:
//    - id, referrer_id (moderator), referee_email, referee_application_id, 
//    - commission_earned, commission_status, created_at
//
// 3. API endpoints needed:
//    - POST /api/moderator-applications (submit application)
//    - GET /api/referral-info/:code (validate referral code)
//    - POST /api/track-referral (record referral relationship)
//    - PUT /api/referrals/:id/commission (update commission when referee becomes active)

interface ApplicationForm {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  location: string;
  languages: string[];
  experienceYears: string;
  experienceDescription: string;
  motivation: string;
  availability: string[];
  agreeToTerms: boolean;
}

const ModeratorApplication: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  
  const [formData, setFormData] = useState<ApplicationForm>({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    location: '',
    languages: [],
    experienceYears: '',
    experienceDescription: '',
    motivation: '',
    availability: [],
    agreeToTerms: false,
  });

  // Get referral code from URL params
  const referralCode = searchParams.get('ref');

  useEffect(() => {
    if (referralCode) {
      // TODO: Backend - Validate referral code and get referrer info
      // API call: GET /api/referral-info/${referralCode}
      // This should return referrer details and validate the code
      
      // Dummy referral info for now
      const dummyReferralInfo = {
        referrerName: 'John Doe',
        referrerCode: referralCode,
        isValid: true,
        commissionRate: 10, // 10% commission
      };
      
      setReferralInfo(dummyReferralInfo);
      
      if (dummyReferralInfo.isValid) {
        toast.success(`You were referred by ${dummyReferralInfo.referrerName}! You'll both earn benefits.`);
      } else {
        toast.error('Invalid referral code');
      }
    }
  }, [referralCode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: checked 
        ? [...prev.languages, language]
        : prev.languages.filter(lang => lang !== language)
    }));
  };

  const handleAvailabilityChange = (time: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: checked 
        ? [...prev.availability, time]
        : prev.availability.filter(avail => avail !== time)
    }));
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'age', 'location', 'experienceYears', 'motivation'];
    const missing = required.filter(field => !formData[field as keyof ApplicationForm]);
    
    if (missing.length > 0) {
      toast.error(`Please fill in all required fields: ${missing.join(', ')}`);
      return false;
    }
    
    if (formData.languages.length === 0) {
      toast.error('Please select at least one language');
      return false;
    }
    
    if (formData.availability.length === 0) {
      toast.error('Please select your availability');
      return false;
    }
    
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Backend Implementation
      // 1. Submit application to database
      // 2. If referred, create referral tracking record
      // 3. Send confirmation emails to applicant and referrer
      // 4. Trigger admin notification for new application
      
      const applicationData = {
        ...formData,
        referredBy: referralInfo?.referrerCode || null,
        applicationDate: new Date().toISOString(),
        status: 'pending'
      };
      
      // API call: POST /api/moderator-applications
      console.log('Submitting application:', applicationData);
      
      // If there's a referral, track it
      if (referralInfo && referralInfo.isValid) {
        const referralData = {
          referrerCode: referralInfo.referrerCode,
          refereeEmail: formData.email,
          applicationId: 'generated-id', // This would come from the application creation
          commissionRate: referralInfo.commissionRate
        };
        
        // API call: POST /api/track-referral
        console.log('Tracking referral:', referralData);
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Application submitted successfully! We\'ll review it within 24-48 hours.');
      
      // Redirect to success page or home
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
  ];

  const availabilityOptions = [
    'Morning (6AM - 12PM)', 'Afternoon (12PM - 6PM)', 
    'Evening (6PM - 12AM)', 'Night (12AM - 6AM)',
    'Weekends', 'Flexible'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              🌍 Work From Anywhere
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Become a Chat Moderator
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our global team of remote chat moderators and help create meaningful connections while earning competitive income from anywhere in the world
            </p>
            
            {referralInfo && referralInfo.isValid && (
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">
                      Referred by {referralInfo.referrerName}
                    </span>
                    <Badge variant="secondary">{referralInfo.commissionRate}% Commission</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">$15-25/Hour</h3>
              <p className="text-sm text-muted-foreground">
                Competitive hourly rates with performance bonuses
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary to-secondary/70 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Remote</h3>
              <p className="text-sm text-muted-foreground">
                Work from home with flexible scheduling options
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Make Impact</h3>
              <p className="text-sm text-muted-foreground">
                Help people find love and meaningful relationships
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quick Start</h3>
              <p className="text-sm text-muted-foreground">
                Get hired fast with our streamlined process
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requirements Section */}
        <Card className="mb-16 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-900">What You Need to Get Started</CardTitle>
            <CardDescription className="text-blue-700">
              Simple requirements to join our remote moderator team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Good Smartphone or Laptop</h4>
                    <p className="text-sm text-blue-700">Modern device capable of running chat applications smoothly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Reliable Internet Connection</h4>
                    <p className="text-sm text-blue-700">Stable broadband connection for consistent communication</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Excellent Communication Skills</h4>
                    <p className="text-sm text-blue-700">Empathy, patience, and professional writing abilities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">18+ Years Old</h4>
                    <p className="text-sm text-blue-700">Legal age requirement for handling relationship conversations</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Moderator Application</CardTitle>
            <CardDescription>
              Tell us about yourself and your experience. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Select onValueChange={(value) => handleInputChange('age', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem>
                      <SelectItem value="36-45">36-45</SelectItem>
                      <SelectItem value="46-55">46-55</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              {/* Languages */}
              <div>
                <Label>Languages Spoken * (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                  {languages.map(language => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={formData.languages.includes(language)}
                        onCheckedChange={(checked) => 
                          handleLanguageChange(language, checked as boolean)
                        }
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <Label htmlFor="experienceYears">Years of Customer Service/Moderation Experience *</Label>
                <Select onValueChange={(value) => handleInputChange('experienceYears', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 years</SelectItem>
                    <SelectItem value="1-3">1-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experienceDescription">
                  Relevant Experience (Optional)
                </Label>
                <Textarea
                  id="experienceDescription"
                  value={formData.experienceDescription}
                  onChange={(e) => handleInputChange('experienceDescription', e.target.value)}
                  placeholder="Describe any relevant experience in customer service, moderation, or related fields..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="motivation">Why do you want to be a moderator? *</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  placeholder="Tell us what motivates you to help people find meaningful connections..."
                  rows={4}
                />
              </div>

              {/* Availability */}
              <div>
                <Label>Availability * (Select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {availabilityOptions.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={formData.availability.includes(option)}
                        onCheckedChange={(checked) => 
                          handleAvailabilityChange(option, checked as boolean)
                        }
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    handleInputChange('agreeToTerms', checked as boolean)
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions and privacy policy *
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. We'll review your application within 24-48 hours</p>
              <p>2. If selected, you'll receive an interview invitation</p>
              <p>3. Successful candidates will go through training</p>
              <p>4. Start earning as a certified moderator!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModeratorApplication;