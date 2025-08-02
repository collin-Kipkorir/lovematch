export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  assignedProfiles?: string[]; // Dummy profile IDs they can manage
}

export interface DummyProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bio: string;
  interests: string[];
  avatar: string;
  location: string;
  isActive: boolean;
  createdBy: string; // Admin ID who created this profile
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toProfileId: string;
  content: string;
  timestamp: string;
  isFromAdmin: boolean;
  adminId?: string; // If sent by admin
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatConversationAdmin {
  id: string;
  realUserId: string;
  dummyProfileId: string;
  realUserName: string;
  dummyProfileName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  assignedAdminId?: string;
  status: 'open' | 'assigned' | 'flagged' | 'closed';
  messages: ChatMessage[];
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'deduction' | 'admin_add' | 'admin_remove';
  method?: 'mpesa' | 'paypal' | 'manual';
  adminId?: string;
  description: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDummyProfiles: number;
  totalCredits: number;
  totalConversations: number;
  activeChats: number;
  flaggedChats: number;
  creditsSpentToday: number;
  newUsersToday: number;
  topAdmins: Array<{
    id: string;
    name: string;
    messagesHandled: number;
  }>;
}

export interface UserFlag {
  id: string;
  userId: string;
  flaggedBy: string; // Admin ID
  reason: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
}