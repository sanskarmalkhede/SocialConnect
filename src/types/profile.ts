export interface Profile {
  id: string
  username: string
  bio?: string | null
  avatar_url?: string | null
  website?: string | null
  location?: string | null
  role: 'user' | 'admin'
  profile_visibility: 'public' | 'private'
  created_at: string
  updated_at: string
  post_count?: number
  follower_count?: number
  following_count?: number
}
