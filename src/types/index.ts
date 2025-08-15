import type { User } from '@supabase/supabase-js'
import type { Profile, Post, Comment, Notification } from '@/lib/supabase/types'

// Extended User type with profile
export interface AuthUser extends User {
  profile?: Profile
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  username: string
}

export interface ProfileFormData {
  username: string
  bio?: string
  website?: string
  location?: string
  profile_visibility: 'public' | 'private' | 'followers_only'
}

export interface PostFormData {
  content: string
  category: 'general' | 'announcement' | 'question'
  image?: File
}

export interface CommentFormData {
  content: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FeedResponse extends PaginatedResponse<Post> {}
export interface CommentsResponse extends PaginatedResponse<Comment> {}
export interface NotificationsResponse extends PaginatedResponse<Notification> {}

// Admin Types
export interface AdminStats {
  totalUsers: number
  totalPosts: number
  activeToday: number
  newUsersThisWeek: number
  newPostsThisWeek: number
  topCategories: Array<{
    category: string
    count: number
  }>
}

export interface UserWithStats extends Profile {
  posts_count: number
  followers_count: number
  following_count: number
  last_active: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface FormState<T = any> extends LoadingState {
  data?: T
  isDirty: boolean
  isValid: boolean
}

// File Upload Types
export interface FileUploadState {
  file?: File
  preview?: string
  isUploading: boolean
  error?: string
}

// Notification State
export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
}

// Feed State
export interface FeedState {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  error?: string
}

// Search Types
export interface SearchFilters {
  query?: string
  category?: 'general' | 'announcement' | 'question'
  author?: string
  dateFrom?: string
  dateTo?: string
}

export interface UserSearchFilters {
  query?: string
  role?: 'user' | 'admin'
  isActive?: boolean
}

// Component Props Types
export interface PostCardProps {
  post: Post
  showActions?: boolean
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onDelete?: (postId: string) => void
}

export interface CommentItemProps {
  comment: Comment
  onDelete?: (commentId: string) => void
}

export interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
}

export interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
}

// Hook Return Types
export interface UseAuthReturn {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

export interface UsePostsReturn {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  error?: string
  createPost: (data: PostFormData) => Promise<void>
  updatePost: (id: string, data: Partial<PostFormData>) => Promise<void>
  deletePost: (id: string) => Promise<void>
  likePost: (id: string) => Promise<void>
  unlikePost: (id: string) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}