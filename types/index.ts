export type EntityType = 'business';

export type Category = 
  | 'restaurant' 
  | 'retail' 
  | 'tech' 
  | 'healthcare'
  | 'education'
  | 'finance';

export interface Entity {
  id: string;
  name: string;
  entityType: EntityType;
  categories: Category[];
  location: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  isClaimed: boolean;
  biasharaScore: number;
  totalReviews: number;
  description: string;
  imageUrl: string;
  isPremium?: boolean;
}

export interface Review {
  id: string;
  entityId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  reviewText: string;
  dateOfExperience: string;
  createdAt: string;
  photoUrls?: string[];
  isVerified: boolean;
  likes: number;
  reports: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  favorites: string[];
  reviewsCount: number;
  isEntityOwner?: boolean;
  ownedEntityIds?: string[];
  bio?: string;
  city?: string;
  joinedAt: string;
  username?: string;
  phoneNumber?: string;
  isPublicProfile: boolean;
  requireFollowApproval: boolean;
  showActivity: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  reviewLikes: boolean;
  reviewReplies: boolean;
  newFollowers: boolean;
  promotions: boolean;
}

export interface UserProfile extends User {
  stats: UserStats;
  badges: Badge[];
  level: number;
}

export interface UserStats {
  totalReviews: number;
  totalPhotos: number;
  totalHelpfulVotes: number;
  totalPoints: number;
  totalViews: number;
  reviewsThisMonth: number;
  citiesReviewed: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'review' | 'photo' | 'follow' | 'like' | 'badge';
  entityId?: string;
  entityName?: string;
  reviewId?: string;
  rating?: number;
  text?: string;
  photoUrl?: string;
  badgeId?: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  status: 'pending' | 'accepted';
}

export interface BookmarkList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  entityIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDraft {
  id: string;
  userId: string;
  entityId: string;
  entityName: string;
  rating?: number;
  reviewText?: string;
  photoUrls?: string[];
  dateOfExperience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'review_like' | 'review_reply' | 'new_follower' | 'badge_earned' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  metadata?: any;
}

export type PlanType = 'basic' | 'standard' | 'premium';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  currency: string;
  features: string[];
  listingsCount: number;
  featuredDays: number;
}

export interface ListingSubmission {
  id?: string;
  userId: string;
  planId: PlanType;
  name: string;
  description: string;
  entityType: EntityType;
  categories: Category[];
  location: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  profilePhotoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface ClaimRequest {
  id?: string;
  userId: string;
  entityId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}
