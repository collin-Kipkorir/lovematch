import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Shield, 
  UserCog, 
  Eye,
  Calendar,
  Mail,
  Key,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { dummyAdmins } from '@/data/adminData';
import { Admin } from '@/types/admin';

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>(dummyAdmins);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isAssignCredentialsOpen, setIsAssignCredentialsOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'moderator' as Admin['role'],
    assignedProfiles: [] as string[],
    tempPassword: ''
  });
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = () => {
    // TODO: Backend implementation - Create admin account with hashed password
    const admin: Admin = {
      id: `admin-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      assignedProfiles: newAdmin.assignedProfiles,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setAdmins([...admins, admin]);
    setNewAdmin({ name: '', email: '', role: 'moderator', assignedProfiles: [], tempPassword: '' });
    setIsCreateModalOpen(false);
    
    toast({
      title: "Moderator Created",
      description: `${admin.name} has been added with temporary login credentials`,
    });
  };

  const handleViewDetails = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsViewDetailsOpen(true);
  };

  const handleAssignCredentials = (admin: Admin) => {
    setSelectedAdmin(admin);
    setCredentials({
      email: admin.email,
      password: '',
      confirmPassword: ''
    });
    setIsAssignCredentialsOpen(true);
  };

  const handleSaveCredentials = () => {
    // TODO: Backend implementation - Update moderator login credentials
    if (credentials.password !== credentials.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Credentials Updated",
      description: `Login credentials for ${selectedAdmin?.name} have been updated`,
    });
    
    setIsAssignCredentialsOpen(false);
    setCredentials({ email: '', password: '', confirmPassword: '' });
  };

  const handleToggleActive = (adminId: string) => {
    setAdmins(admins.map(admin =>
      admin.id === adminId ? { ...admin, isActive: !admin.isActive } : admin
    ));
    
    const admin = admins.find(a => a.id === adminId);
    toast({
      title: `Admin ${admin?.isActive ? 'Deactivated' : 'Activated'}`,
      description: `${admin?.name} account status updated`,
    });
  };

  const handleDeleteAdmin = (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    setAdmins(admins.filter(a => a.id !== adminId));
    
    toast({
      title: "Admin Deleted",
      description: `${admin?.name} has been removed`,
      variant: "destructive"
    });
  };

  const getRoleBadge = (role: Admin['role']) => {
    const variants = {
      super_admin: 'default',
      moderator: 'secondary'
    } as const;
    
    const labels = {
      super_admin: 'Super Admin',
      moderator: 'Moderator'
    };

    return (
      <Badge variant={variants[role]} className="text-xs">
        {labels[role]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Moderators Management</h2>
          <p className="text-muted-foreground">
            Manage moderator accounts, assign credentials and monitor performance
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Add a new administrator to the platform
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@lovematch.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newAdmin.role} onValueChange={(value: Admin['role']) => 
                  setNewAdmin({ ...newAdmin, role: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tempPassword">Temporary Password</Label>
                <Input
                  id="tempPassword"
                  type="password"
                  placeholder="Generate temporary password"
                  value={newAdmin.tempPassword}
                  onChange={(e) => setNewAdmin({ ...newAdmin, tempPassword: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will be the initial password for the moderator
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin}>
                  Create Moderator
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Administrators ({filteredAdmins.length})</CardTitle>
          <CardDescription>
            Manage admin accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {admin.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(admin.role)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={admin.isActive}
                        onCheckedChange={() => handleToggleActive(admin.id)}
                      />
                      <span className={`text-sm ${admin.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {admin.lastLogin ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(admin.lastLogin).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(admin)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAssignCredentials(admin)}
                        title="Assign Login Credentials"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {admin.role !== 'super_admin' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderator Details</DialogTitle>
            <DialogDescription>
              View detailed information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedAdmin && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Badge variant={selectedAdmin.role === 'super_admin' ? 'default' : 'secondary'}>
                    {selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Moderator'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant={selectedAdmin.isActive ? 'default' : 'secondary'}>
                    {selectedAdmin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-semibold">
                      {Math.floor(Math.random() * 500 + 100)}
                    </p>
                    <p className="text-sm text-muted-foreground">Messages Handled</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-semibold">
                      ${Math.floor(Math.random() * 1000 + 200)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-semibold">
                      {Math.floor(Math.random() * 50 + 10)}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Profiles</p>
                  </CardContent>
                </Card>
              </div>

              {/* Account Activity */}
              <div className="space-y-2">
                <Label>Recent Activity</Label>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-muted-foreground">
                      {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedAdmin.lastLogin && (
                    <div className="flex justify-between">
                      <span>Last Login:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedAdmin.lastLogin).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Assigned Profiles:</span>
                    <span className="text-muted-foreground">
                      {selectedAdmin.assignedProfiles?.length || 0} profiles
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDetailsOpen(false);
                  handleAssignCredentials(selectedAdmin);
                }}>
                  <Key className="h-4 w-4 mr-2" />
                  Manage Credentials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Credentials Modal */}
      <Dialog open={isAssignCredentialsOpen} onOpenChange={setIsAssignCredentialsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Login Credentials</DialogTitle>
            <DialogDescription>
              Set or update login credentials for {selectedAdmin?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credEmail">Email Address</Label>
              <Input
                id="credEmail"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="moderator@lovematch.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credPassword">New Password</Label>
              <Input
                id="credPassword"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credConfirmPassword">Confirm Password</Label>
              <Input
                id="credConfirmPassword"
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Security Guidelines:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Password must be at least 8 characters</li>
                <li>• Include uppercase, lowercase, numbers</li>
                <li>• Moderator will be required to change on first login</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignCredentialsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCredentials}>
                <Key className="h-4 w-4 mr-2" />
                Update Credentials
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;