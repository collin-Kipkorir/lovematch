/* 
 * ModeratorApplications Component - Manage moderator job applications
 * 
 * BACKEND INTEGRATION REQUIREMENTS:
 * 
 * 1. API Endpoints needed:
 *    - GET /api/admin/moderator-applications - Fetch all applications with pagination and filters
 *    - GET /api/admin/moderator-applications/:id - Get detailed application info
 *    - PUT /api/admin/moderator-applications/:id/status - Update application status (approve/reject/pending)
 *    - POST /api/admin/moderator-applications/:id/interview - Schedule interview
 *    - POST /api/admin/moderator-applications/:id/notes - Add internal notes
 *    - DELETE /api/admin/moderator-applications/:id - Delete application
 * 
 * 2. Database Schema needed:
 *    - moderator_applications table: id, full_name, email, phone, age, location, languages, 
 *      experience_years, experience_description, motivation, availability, referred_by, 
 *      referral_code, status, created_at, updated_at, reviewed_by, interview_scheduled
 *    - application_notes table: id, application_id, admin_id, note, created_at
 * 
 * 3. Real-time updates:
 *    - WebSocket notifications for new applications
 *    - Email notifications to HR/admin when new applications arrive
 * 
 * 4. Integration features:
 *    - Export applications to CSV/Excel for HR review
 *    - Bulk operations (approve/reject multiple applications)
 *    - Application scoring/ranking system
 *    - Referral tracking and commission calculation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Languages, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  MessageSquare,
  Download,
  Filter,
  Search,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';

// TODO: Backend Integration - Import from API response types
interface ModeratorApplication {
  id: string;
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
  referredBy?: string;
  referralCode?: string;
  status: 'pending' | 'approved' | 'rejected' | 'interview_scheduled';
  createdAt: string;
  reviewedBy?: string;
  interviewDate?: string;
  notes?: string;
}

const ModeratorApplications: React.FC = () => {
  // TODO: Backend Integration - Replace with real API calls
  const [applications, setApplications] = useState<ModeratorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ModeratorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ModeratorApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');

  // TODO: Backend Integration - Load applications from API
  useEffect(() => {
    fetchApplications();
  }, []);

  // TODO: Backend Integration - API call: GET /api/admin/moderator-applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Dummy data for demonstration - replace with real API call
      const dummyApplications: ModeratorApplication[] = [
        {
          id: '1',
          fullName: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+254712345678',
          age: '26-35',
          location: 'Nairobi, Kenya',
          languages: ['English', 'Swahili'],
          experienceYears: '2-3',
          experienceDescription: 'Customer service experience at Safaricom for 2 years. Handled chat support and resolved customer complaints professionally.',
          motivation: 'I love helping people connect and communicate. Working remotely would allow me to balance work with my studies.',
          availability: ['Morning (6AM - 12PM)', 'Evening (6PM - 12AM)', 'Weekends'],
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          referredBy: 'John Doe',
          referralCode: 'REF123'
        },
        {
          id: '2',
          fullName: 'Michael Ochieng',
          email: 'michael.ochieng@email.com',
          phone: '+254723456789',
          age: '18-25',
          location: 'Mombasa, Kenya',
          languages: ['English', 'Swahili', 'Arabic'],
          experienceYears: '1-2',
          experienceDescription: 'Social media manager for local business. Experienced in online communication and customer engagement.',
          motivation: 'Looking for flexible remote work opportunity. I have good communication skills and reliable internet.',
          availability: ['Afternoon (12PM - 6PM)', 'Night (12AM - 6AM)', 'Flexible'],
          status: 'approved',
          createdAt: '2024-01-14T14:20:00Z',
          reviewedBy: 'Admin User'
        },
        {
          id: '3',
          fullName: 'Grace Wanjiku',
          email: 'grace.wanjiku@email.com',
          phone: '+254734567890',
          age: '26-35',
          location: 'Kisumu, Kenya',
          languages: ['English', 'Swahili', 'Luo'],
          experienceYears: '3-5',
          experienceDescription: 'Call center agent with 4 years experience. Excellent at handling difficult conversations and de-escalation.',
          motivation: 'Want to transition to remote work. I have experience in relationship counseling and communication.',
          availability: ['Morning (6AM - 12PM)', 'Afternoon (12PM - 6PM)'],
          status: 'interview_scheduled',
          createdAt: '2024-01-13T09:15:00Z',
          interviewDate: '2024-01-20T10:00:00Z'
        },
        {
          id: '4',
          fullName: 'David Kimani',
          email: 'david.kimani@email.com',
          phone: '+254745678901',
          age: '18-25',
          location: 'Nakuru, Kenya',
          languages: ['English', 'Swahili'],
          experienceYears: '0-1',
          experienceDescription: 'Recent graduate with IT background. Good with technology and online platforms.',
          motivation: 'Looking for my first remote job opportunity. Very motivated to learn and grow.',
          availability: ['Night (12AM - 6AM)', 'Weekends', 'Flexible'],
          status: 'rejected',
          createdAt: '2024-01-12T16:45:00Z',
          reviewedBy: 'Admin User',
          notes: 'Insufficient experience for current openings'
        },
        {
          id: '5',
          fullName: 'Alice Njeri',
          email: 'alice.njeri@email.com',
          phone: '+254756789012',
          age: '36-45',
          location: 'Eldoret, Kenya',
          languages: ['English', 'Swahili', 'Kalenjin'],
          experienceYears: '5+',
          experienceDescription: 'Former teacher with 8 years experience. Excellent communication and people skills. Experience with online learning platforms.',
          motivation: 'Looking for remote work that utilizes my communication skills. Want to help people in a new way.',
          availability: ['Morning (6AM - 12PM)', 'Evening (6PM - 12AM)'],
          status: 'pending',
          createdAt: '2024-01-11T11:30:00Z'
        }
      ];
      
      setApplications(dummyApplications);
      setFilteredApplications(dummyApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on search and filters
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(app => app.experienceYears === experienceFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, experienceFilter]);

  // TODO: Backend Integration - API call: PUT /api/admin/moderator-applications/:id/status
  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus as ModeratorApplication['status'], reviewedBy: 'Current Admin' }
          : app
      ));
      
      // TODO: Make actual API call
      console.log(`Updating application ${applicationId} to status: ${newStatus}`);
      
      toast.success(`Application ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  // TODO: Backend Integration - API call: POST /api/admin/moderator-applications/:id/interview
  const handleScheduleInterview = async (applicationId: string) => {
    try {
      const interviewDate = new Date();
      interviewDate.setDate(interviewDate.getDate() + 7); // Schedule for next week
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'interview_scheduled', interviewDate: interviewDate.toISOString() }
          : app
      ));
      
      toast.success('Interview scheduled successfully');
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error('Failed to schedule interview');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'interview_scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Interview Scheduled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleViewApplication = (application: ModeratorApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  // TODO: Backend Integration - Export functionality
  const handleExportApplications = () => {
    // Convert to CSV and download
    console.log('Exporting applications...');
    toast.success('Applications exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Moderator Applications</h2>
          <p className="text-muted-foreground">
            Review and manage moderator job applications
          </p>
        </div>
        <Button onClick={handleExportApplications} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Applications
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.status === 'interview_scheduled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience Levels</SelectItem>
                <SelectItem value="0-1">0-1 years</SelectItem>
                <SelectItem value="1-2">1-2 years</SelectItem>
                <SelectItem value="2-3">2-3 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="5+">5+ years</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setExperienceFilter('all');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Click on any application to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found matching your filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.fullName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {application.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {application.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.experienceYears}</div>
                        <div className="text-sm text-muted-foreground">Age: {application.age}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.languages.slice(0, 2).map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                        {application.languages.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{application.languages.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApplication(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {application.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(application.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Application Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review applicant information and take action
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedApplication.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApplication.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApplication.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApplication.location}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Age Range: </span>
                      <span>{selectedApplication.age}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Experience: </span>
                      <span className="font-medium">{selectedApplication.experienceYears} years</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Languages: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedApplication.languages.map((lang) => (
                          <Badge key={lang} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Availability: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedApplication.availability.map((time) => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Applied: </span>
                      <span>{new Date(selectedApplication.createdAt).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Experience Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{selectedApplication.experienceDescription}</p>
                </CardContent>
              </Card>

              {/* Motivation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Motivation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{selectedApplication.motivation}</p>
                </CardContent>
              </Card>

              {/* Referral Info */}
              {selectedApplication.referredBy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Referral Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Referred by: </span>
                        <span className="font-medium">{selectedApplication.referredBy}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Referral Code: </span>
                        <span className="font-mono">{selectedApplication.referralCode}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status and Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Status & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Current Status:</span>
                    {getStatusBadge(selectedApplication.status)}
                  </div>

                  {selectedApplication.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'approved');
                          setIsViewModalOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Application
                      </Button>
                      <Button
                        onClick={() => {
                          handleScheduleInterview(selectedApplication.id);
                          setIsViewModalOpen(false);
                        }}
                        variant="outline"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Interview
                      </Button>
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedApplication.id, 'rejected');
                          setIsViewModalOpen(false);
                        }}
                        variant="destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Application
                      </Button>
                    </div>
                  )}

                  {selectedApplication.interviewDate && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Interview Scheduled: {new Date(selectedApplication.interviewDate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.reviewedBy && (
                    <div className="text-sm text-muted-foreground">
                      Reviewed by: {selectedApplication.reviewedBy}
                    </div>
                  )}

                  {selectedApplication.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Notes: </span>
                      <span className="text-sm">{selectedApplication.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModeratorApplications;