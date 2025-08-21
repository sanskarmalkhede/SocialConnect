import { supabaseAdmin } from '@/lib/supabase/server'
import { handleDatabaseError } from '@/lib/errors'
import type { Profile, Post } from '@/types'

export async function getProfileByUsername(username: string, currentUserId?: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      posts (*, author:profiles!author_id(*), likes(user_id)),
      followers:follows!following_id(count),
      following:follows!follower_id(count)
    `)
    .eq('username', username)
    .single()

  if (error) {
    throw handleDatabaseError(error)
  }

  const profile = data

  // Check if the current user is following this profile
  let isFollowing = false
  if (currentUserId) {
    const { data: followData } = await supabaseAdmin
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!followData
  }

  return {
    ...profile,
    follower_count: profile.followers[0]?.count || 0,
    following_count: profile.following[0]?.count || 0,
    posts: profile.posts.map((p: Post) => ({
      ...p,
      is_liked_by_user: currentUserId ? p.likes.some((l: { user_id: string }) => l.user_id === currentUserId) : false
    })),
    is_following: isFollowing
  } as Profile
}