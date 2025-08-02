import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/Admin/AdminLayout';
import SuperAdminDashboard from '@/components/Admin/SuperAdminDashboard';
import UserManagement from '@/components/Admin/UserManagement';
import DummyProfileManager from '@/components/Admin/DummyProfileManager';
import ChatInbox from '@/components/Admin/ChatInbox';
import ChatMonitor from '@/components/Admin/ChatMonitor';
import CreditManager from '@/components/Admin/CreditManager';
import AdminManagement from '@/components/Admin/AdminManagement';
import ModeratorEarnings from '@/components/Admin/ModeratorEarnings';
import ModeratorReferrals from '@/components/Admin/ModeratorReferrals';
import SuperAdminEarnings from '@/components/Admin/SuperAdminEarnings';
import PaymentRequests from '@/components/Admin/PaymentRequests';

/**
 * ADMIN PANEL - BACKEND INTEGRATION GUIDE
 * 
 * TODO: Replace mock admin system with real role-based authentication
 * 
 * DATABASE SCHEMA:
 * Table: admin_users
 * - id (uuid, primary key)
 * - email (text, unique)
 * - password_hash (text)
 * - name (text)
 * - role (enum: 'super_admin', 'admin', 'moderator')
 * - permissions (jsonb) - granular permissions object
 * - is_active (boolean, default true)
 * - last_login (timestamp)
 * - created_at (timestamp)
 * - created_by (uuid, foreign key to admin_users.id)
 * 
 * Table: admin_sessions
 * - id (uuid, primary key)
 * - admin_id (uuid, foreign key)
 * - session_token (text, unique)
 * - expires_at (timestamp)
 * - ip_address (text)
 * - user_agent (text)
 * - created_at (timestamp)
 * 
 * ROLE-BASED ACCESS CONTROL:
 * Super Admin:
 * - Full system access
 * - Manage all admins and moderators
 * - View global analytics and earnings
 * - System configuration
 * - User management and banning
 * 
 * Admin:
 * - Manage moderators
 * - View earnings and analytics
 * - User management (limited)
 * - Content moderation oversight
 * 
 * Moderator:
 * - Chat monitoring and responses
 * - Content moderation
 * - Basic user support
 * - Earnings tracking (own only)
 * 
 * SECURITY FEATURES:
 * - Multi-factor authentication (MFA)
 * - Session management with token rotation
 * - IP whitelisting for admin access
 * - Audit logging for all admin actions
 * - Rate limiting for admin endpoints
 * - Role permission validation on every request
 * 
 * AUDIT SYSTEM:
 * Table: admin_audit_logs
 * - id (uuid, primary key)
 * - admin_id (uuid, foreign key)
 * - action (text) - action performed
 * - resource_type (text) - type of resource affected
 * - resource_id (text) - ID of affected resource
 * - old_values (jsonb) - before changes
 * - new_values (jsonb) - after changes
 * - ip_address (text)
 * - user_agent (text)
 * - created_at (timestamp)
 */

const Admin: React.FC = () => {
  const { isLoggedIn } = useAdminAuth();

  if (!isLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="chat-inbox" element={<ChatInbox />} />
        <Route path="chat-monitor" element={<ChatMonitor />} />
        <Route path="payment-requests" element={<PaymentRequests />} />
        <Route path="earnings" element={<ModeratorEarnings />} />
        <Route path="referrals" element={<ModeratorReferrals />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="credits" element={<CreditManager />} />
        <Route path="dummy-profiles" element={<DummyProfileManager />} />
        <Route path="admin-management" element={<AdminManagement />} />
        <Route path="super-earnings" element={<SuperAdminEarnings />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;