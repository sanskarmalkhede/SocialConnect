// Application Constants

// Post Categories
export const POST_CATEGORIES = {
  GENERAL: 'general',
  ANNOUNCEMENT: 'announcement',
  QUESTION: 'question'
} as const

export const POST_CATEGORY_LABELS = {
  [POST_CATEGORIES.GENERAL]: 'General',
  [POST_CATEGORIES.ANNOUNCEMENT]: 'Announcement',
  [POST_CATEGORIES.QUESTION]: 'Question'
} as const

// Profile Visibility Options
export const PROFILE_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FOLLOWERS_ONLY: 'followers_only'
} as const

export const PROFILE_VISIBILITY_LABELS = {
  [PROFILE_VISIBILITY.PUBLIC]: 'Public',
  [PROFILE_VISIBILITY.PRIVATE]: 'Private',
  [PROFILE_VISIBILITY.FOLLOWERS_ONLY]: 'Followers Only'
} as const

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment'
} as const

export const NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.FOLLOW]: 'started following you',
  [NOTIFICATION_TYPES.LIKE]: 'liked your post',
  [NOTIFICATION_TYPES.COMMENT]: 'commented on your post'
} as const

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png']
} as const

// Content Limits
export const CONTENT_LIMITS = {
  POST_MAX_LENGTH: 280,
  COMMENT_MAX_LENGTH: 200,
  BIO_MAX_LENGTH: 160,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8
} as const

// Pagination
export const PAGINATION = {
  POSTS_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 10,
  NOTIFICATIONS_PER_PAGE: 20,
  USERS_PER_PAGE: 20
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FEED: '/feed',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_POSTS: '/admin/posts',
  ADMIN_STATS: '/admin/stats',
  RESET_PASSWORD: '/auth/reset-password'
} as const

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  // Removed extra auth endpoints for MVP
  
  // Users
  USERS: '/api/users',
  USER_BY_ID: (id: string) => `/api/users/${id}`,
  USER_ME: '/api/users/me',
  
  // Posts
  POSTS: '/api/posts',
  POST_BY_ID: (id: string) => `/api/posts/${id}`,
  POST_LIKE: (id: string) => `/api/posts/${id}/like`,
  POST_LIKE_STATUS: (id: string) => `/api/posts/${id}/like-status`,
  POST_COMMENTS: (id: string) => `/api/posts/${id}/comments`,
  
  // Comments
  COMMENT_BY_ID: (id: string) => `/api/comments/${id}`,
  
  // Follow
  FOLLOW_USER: (id: string) => `/api/follow/${id}`,
  
  // Feed
  FEED: '/api/feed',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: '/api/notifications/mark-all-read',
  
  // Admin
  // Admin endpoints can be added later
} as const

// Storage Buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POST_IMAGES: 'post-images'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size must be less than 2MB.',
  INVALID_FILE_TYPE: 'Only JPEG and PNG files are allowed.',
  USERNAME_TAKEN: 'This username is already taken.',
  EMAIL_TAKEN: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  COMMENT_DELETED: 'Comment deleted successfully!',
  FOLLOW_SUCCESS: 'Successfully followed user!',
  UNFOLLOW_SUCCESS: 'Successfully unfollowed user!',
  LIKE_SUCCESS: 'Post liked!',
  UNLIKE_SUCCESS: 'Post unliked!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  PASSWORD_RESET_SENT: 'Password reset email sent!',
  REGISTRATION_SUCCESS: 'Account created successfully! Please check your email to verify your account.',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully!'
} as const