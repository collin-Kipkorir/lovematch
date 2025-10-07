export interface DummyProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  location?: string;
  bio: string;
  interests: string[];
  avatar: string;
  profilePicture?: string;
}

// Use Profile type from useProfiles but make avatar required
export interface Profile extends Omit<import('../hooks/useProfiles').Profile, 'avatar'> {
  avatar: string;
}

export const dummyProfiles: Profile[] = [
  {
    id: '1',
    name: 'Emma',
    age: 28,
    gender: 'Female',
    location: 'New York',
    bio: 'Love traveling, coffee, and good conversations. Looking for someone genuine.',
    interests: ['travel', 'coffee', 'reading', 'yoga'],
    avatar: '👩🏼‍💼',
    profilePicture: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'James',
    age: 32,
    gender: 'Male',
    location: 'Los Angeles',
    bio: 'Fitness enthusiast and dog lover. Always up for outdoor adventures.',
    interests: ['fitness', 'hiking', 'dogs', 'cooking'],
    avatar: '👨🏻‍💻',
    profilePicture: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Sophia',
    age: 25,
    gender: 'Female',
    location: 'Miami',
    bio: 'Artist by day, foodie by night. Seeking creative souls and deep connections.',
    interests: ['art', 'food', 'music', 'photography'],
    avatar: '👩🏽‍🎨',
    profilePicture: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Michael',
    age: 29,
    gender: 'Male',
    location: 'Chicago',
    bio: 'Tech professional who loves board games and craft beer.',
    interests: ['technology', 'games', 'beer', 'movies'],
    avatar: '👨🏽‍⚕️',
    profilePicture: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Olivia',
    age: 26,
    gender: 'Female',
    location: 'Seattle',
    bio: 'Book lover and nature enthusiast. Perfect date: hiking followed by a cozy café.',
    interests: ['books', 'nature', 'hiking', 'tea'],
    avatar: '👩🏻‍🌾',
    profilePicture: 'https://images.unsplash.com/photo-1535268647677-30574x4585?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '6',
    name: 'David',
    age: 34,
    gender: 'Male',
    location: 'Boston',
    bio: 'Chef who loves experimenting with flavors. Looking for a foodie partner.',
    interests: ['cooking', 'wine', 'travel', 'music'],
    avatar: '👨🏾‍🍳',
    profilePicture: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '7',
    name: 'Isabella',
    age: 27,
    gender: 'Female',
    location: 'San Francisco',
    bio: 'Yoga instructor and meditation enthusiast. Seeking mindful connections.',
    interests: ['yoga', 'meditation', 'wellness', 'nature'],
    avatar: '👩🏻‍⚕️',
    profilePicture: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face'
  },
  {
    id: '8',
    name: 'Alex',
    age: 30,
    gender: 'Other',
    location: 'Portland',
    bio: 'Creative writer and coffee shop connoisseur. Love deep conversations.',
    interests: ['writing', 'coffee', 'literature', 'indie music'],
    avatar: '🧑🏼‍💻',
    profilePicture: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=400&fit=crop&crop=face'
  }
];

export const adminResponses = [
  "Hey there! Thanks for reaching out. How can I help you today?",
  "I'd love to get to know you better! What are you looking for in a match?",
  "That's really interesting! Tell me more about your hobbies.",
  "You seem like such a genuine person. What's your ideal date like?",
  "I appreciate you sharing that with me. What's been on your mind lately?",
  "That sounds amazing! I'd love to hear more about your experiences.",
  "You have such a positive energy! What motivates you in life?",
  "Thanks for being so open. What are your thoughts on relationships?",
  "That's a great perspective! What are you passionate about?",
  "I'm really enjoying our conversation. What would you like to know about me?"
];