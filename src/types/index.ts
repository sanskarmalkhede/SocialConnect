import { Database } from './supabase'

// Re-exporting generated types for convenience
export type Json = Database['public']['Tables']['posts']['Row']['content']

// Core Models
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  posts?: Post[]
  follower_count: number
  following_count: number
  post_count: number
  is_following?: boolean
}

export type Post = Database['public']['Tables']['posts']['Row'] & {
  author: Profile
  likes: { user_id: string }[]
  is_liked_by_user?: boolean
}

export type Notification = Database['public']['Tables']['notifications']['Row'] & {
  sender: Profile
}

export type Comment = Database['public']['Tables']['comments']['Row'] & {
  author: Profile
}

// Form Data
export type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PostFormData = {
  content: string
  image_url?: string
}

// API & Feed
export interface FeedStatsData {
  followingCount?: number
  newPostsLast24h?: number
  totalPosts?: number
  totalUsers?: number
  lastUpdated: string
}