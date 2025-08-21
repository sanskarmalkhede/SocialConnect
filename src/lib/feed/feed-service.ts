
import { supabaseAdmin } from '@/lib/supabase/server'
import { handleDatabaseError } from '@/lib/errors'
import type { Post } from '@/types'

/**
 * Get personalized feed for a user (posts from followed users + own posts)
 */
export async function getPersonalizedFeed(userId: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    // Get the list of users the current user is following
    const { data: followingData, error: followingError } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (followingError) {
      throw handleDatabaseError(followingError)
    }

    const followingIds = followingData?.map(f => f.following_id) || []
    const allUserIds = [userId, ...followingIds]

    // Get posts from followed users + own posts
    const { data, error, count } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          username,
          avatar_url
        ),
        likes ( user_id )
      `, { count: 'exact' })
      .in('author_id', allUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    const posts = data?.map(p => ({
      ...p,
      is_liked_by_user: p.likes.some(like => like.user_id === userId)
    })) as Post[] || []

    return {
      posts,
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get public feed (all public posts, good for discovery)
 */
export async function getPublicFeed(userId?: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          username,
          avatar_url
        ),
        likes ( user_id )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    const posts = data?.map(p => ({
      ...p,
      is_liked_by_user: userId ? p.likes.some(like => like.user_id === userId) : false
    })) as Post[] || []

    return {
      posts,
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    throw error
  }
}
