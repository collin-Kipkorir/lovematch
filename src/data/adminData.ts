import { Admin, DummyProfile, ChatConversationAdmin, CreditTransaction, AdminStats } from '@/types/admin';

export const dummyAdmins: Admin[] = [
  {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@lovematch.com',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-07-30T10:00:00Z',
    isActive: true,
    assignedProfiles: []
  },
  {
    id: 'admin-2',
    name: 'Sarah Johnson',
    email: 'sarah@lovematch.com',
    role: 'moderator',
    createdAt: '2024-02-15T00:00:00Z',
    lastLogin: '2024-07-30T09:30:00Z',
    isActive: true,
    assignedProfiles: ['dummy-1', 'dummy-2']
  },
  {
    id: 'admin-3',
    name: 'Mike Chen',
    email: 'mike@lovematch.com',
    role: 'moderator',
    createdAt: '2024-03-01T00:00:00Z',
    lastLogin: '2024-07-29T16:45:00Z',
    isActive: true,
    assignedProfiles: ['dummy-3']
  }
];

export const dummyProfiles: DummyProfile[] = [
  {
    id: 'dummy-1',
    name: 'Emma Rose',
    age: 25,
    gender: 'Female',
    bio: 'Adventure seeker who loves hiking and trying new cuisines. Looking for someone to explore life with!',
    interests: ['hiking', 'cooking', 'travel', 'photography'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    location: 'San Francisco, CA',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'dummy-2',
    name: 'Alex Thompson',
    age: 28,
    gender: 'Male',
    bio: 'Tech enthusiast and coffee lover. Love deep conversations and weekend adventures.',
    interests: ['technology', 'coffee', 'music', 'reading'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    location: 'Austin, TX',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'dummy-3',
    name: 'Sofia Martinez',
    age: 26,
    gender: 'Female',
    bio: 'Artist and yoga instructor. Passionate about mindfulness and creative expression.',
    interests: ['art', 'yoga', 'meditation', 'nature'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    location: 'Los Angeles, CA',
    isActive: true,
    createdBy: 'admin-2',
    createdAt: '2024-02-01T00:00:00Z'
  }
];

export const dummyChatConversations: ChatConversationAdmin[] = [
  {
    id: 'conv-1',
    realUserId: '1',
    dummyProfileId: 'dummy-1',
    realUserName: 'Demo User',
    dummyProfileName: 'Emma Rose',
    lastMessage: 'Would love to go hiking this weekend!',
    lastMessageTime: '2024-07-30T14:30:00Z',
    unreadCount: 1,
    assignedAdminId: 'admin-2',
    status: 'assigned',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        fromUserId: '1',
        toProfileId: 'dummy-1',
        content: 'Hi Emma! I love your hiking photos',
        timestamp: '2024-07-30T14:00:00Z',
        isFromAdmin: false,
        status: 'read'
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        fromUserId: 'dummy-1',
        toProfileId: '1',
        content: 'Thank you! Do you enjoy hiking too?',
        timestamp: '2024-07-30T14:15:00Z',
        isFromAdmin: true,
        adminId: 'admin-2',
        status: 'read'
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        fromUserId: '1',
        toProfileId: 'dummy-1',
        content: 'Yes! Would love to go hiking this weekend!',
        timestamp: '2024-07-30T14:30:00Z',
        isFromAdmin: false,
        status: 'delivered'
      }
    ]
  }
];

export const dummyCreditTransactions: CreditTransaction[] = [
  {
    id: 'tx-1',
    userId: '1',
    amount: 10,
    type: 'purchase',
    method: 'mpesa',
    description: 'M-Pesa credit purchase',
    timestamp: '2024-07-29T10:00:00Z'
  },
  {
    id: 'tx-2',
    userId: '1',
    amount: -1,
    type: 'deduction',
    description: 'Message sent to Emma Rose',
    timestamp: '2024-07-30T14:00:00Z'
  },
  {
    id: 'tx-3',
    userId: '1',
    amount: 5,
    type: 'admin_add',
    adminId: 'admin-1',
    description: 'Manual credit adjustment by admin',
    timestamp: '2024-07-30T15:00:00Z'
  }
];

export const adminStats: AdminStats = {
  totalUsers: 1247,
  totalDummyProfiles: 25,
  totalCredits: 15432,
  totalConversations: 324,
  activeChats: 45,
  flaggedChats: 3,
  creditsSpentToday: 234,
  newUsersToday: 12,
  topAdmins: [
    { id: 'admin-2', name: 'Sarah Johnson', messagesHandled: 156 },
    { id: 'admin-3', name: 'Mike Chen', messagesHandled: 89 },
  ]
};