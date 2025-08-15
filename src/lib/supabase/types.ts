export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          bio: string | null
          avatar_url: string | null
          website: string | null
          location: string | null
          role: 'user' | 'admin'
          profile_visibility: 'public' | 'private' | 'followers_only'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          role?: 'user' | 'admin'
          profile_visibility?: 'public' | 'private' | 'followers_only'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          role?: 'user' | 'admin'
          profile_visibility?: 'public' | 'private' | 'followers_only'
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          content: string
          image_url: string | null
          author_id: string
          category: 'general' | 'announcement' | 'question'
          created_at: string
          updated_at: string
          is_active: boolean
          like_count: number
          comment_count: number
        }
        Insert: {
          id?: string
          content: string
          image_url?: string | null
          author_id: string
          category?: 'general' | 'announcement' | 'question'
          created_at?: string
          updated_at?: string
          is_active?: boolean
          like_count?: number
          comment_count?: number
        }
        Update: {
          id?: string
          content?: string
          image_url?: string | null
          author_id?: string
          category?: 'general' | 'announcement' | 'question'
          created_at?: string
          updated_at?: string
          is_active?: boolean
          like_count?: number
          comment_count?: number
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          is_active?: boolean
          created_at?: string
        }
      }
      likes: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          sender_id: string
          notification_type: 'follow' | 'like' | 'comment'
          post_id: string | null
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          sender_id: string
          notification_type: 'follow' | 'like' | 'comment'
          post_id?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          sender_id?: string
          notification_type?: 'follow' | 'like' | 'comment'
          post_id?: string | null
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Application Types
export interface Profile {
  id: string
  username: string
  bio?: string
  avatar_url?: string
  website?: string
  location?: string
  role: 'user' | 'admin'
  profile_visibility: 'public' | 'private' | 'followers_only'
  follower_count: number
  following_count: number
  post_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  content: string
  image_url?: string
  author_id: string
  category: 'general' | 'announcement' | 'question'
  created_at: string
  updated_at: string
  is_active: boolean
  like_count: number
  comment_count: number
  author: Profile
  is_liked_by_user?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  is_active: boolean
  created_at: string
  author: Profile
}

export interface Notification {
  id: string
  recipient_id: string
  sender_id: string
  notification_type: 'follow' | 'like' | 'comment'
  post_id?: string
  message: string
  is_read: boolean
  created_at: string
  sender: Profile
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  user_id: string
  post_id: string
  created_at: string
}