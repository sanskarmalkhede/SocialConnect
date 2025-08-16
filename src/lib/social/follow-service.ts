import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError, ConflictError, ValidationError, NotFoundError } from '@/lib/errors'
import { getProfileById } from '@/lib/profile/profile-service'

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  try {
    // Prevent self-following
    if (followerId === followingId) {
      throw new ValidationError('Cannot follow yourself')
    }

    // Check if target user exists
    const targetProfile = await getProfileById(followingId)
    if (!targetProfile) {
      throw new NotFoundError('User not found')
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (existingFollow) {
      throw new ConflictError('Already following this user')
    }

    // Create follow relationship
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Follow user error:', error)
    throw error
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Unfollow user error:', error)
    throw error
  }
}

/**
 * Check if user is following another user
 */
export async function checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (error && error.code === 'PGRST116') {
      return false // No follow relationship found
    }

    if (error) {
      throw handleDatabaseError(error)
    }

    return !!data
  } catch (error) {
    console.error('Check follow status error:', error)
    throw error
  }
}

/**
 * Get follow statistics for a user
 */
export async function getFollowStats(userId: string) {
  try {
    // Get follower count
    const { count: followerCount, error: followerError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (followerError) {
      throw handleDatabaseError(followerError)
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (followingError) {
      throw handleDatabaseError(followingError)
    }

    return {
      followerCount: followerCount || 0,
      followingCount: followingCount || 0
    }
  } catch (error) {
    console.error('Get follow stats error:', error)
    throw error
  }
}

/**
 * Get mutual followers between two users
 */
export async function getMutualFollowers(userId1: string, userId2: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', userId1)
      .in('follower_id', 
        // Subquery to get followers of userId2
        supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId2)
      )

    if (error) {
      throw handleDatabaseError(error)
    }

    return data?.map(item => item.follower) || []
  } catch (error) {
    console.error('Get mutual followers error:', error)
    throw error
  }
}

/**
 * Get suggested users to follow (users with most followers that current user isn't following)
 */
export async function getSuggestedFollows(userId: string, limit: number = 10) {
  try {
    // Get users that the current user is not following, ordered by follower count
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        bio,
        follower_count,
        profile_visibility
      `)
      .eq('profile_visibility', 'public') // Only suggest public profiles
      .neq('id', userId) // Exclude current user
      .not('id', 'in', `(
        SELECT following_id 
        FROM follows 
        WHERE follower_id = '${userId}'
      )`)
      .order('follower_count', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (error) {
    console.error('Get suggested follows error:', error)
    throw error
  }
}

/**
 * Get follow activity (recent follows for a user)
 */
export async function getFollowActivity(userId: string, limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        *,
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          avatar_url
        ),
        following:profiles!follows_following_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (error) {
    console.error('Get follow activity error:', error)
    throw error
  }
}

/**
 * Bulk follow operations (for importing from other platforms)
 */
export async function bulkFollowUsers(followerId: string, followingIds: string[]): Promise<{
  successful: string[]
  failed: Array<{ id: string; error: string }>
}> {
  const successful: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const followingId of followingIds) {
    try {
      await followUser(followerId, followingId)
      successful.push(followingId)
    } catch (error) {
      failed.push({
        id: followingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { successful, failed }
}

/**
 * Get follow recommendations based on mutual connections
 */
export async function getFollowRecommendations(userId: string, limit: number = 10) {
  try {
    // Get users followed by people the current user follows (friends of friends)
    const { data, error } = await supabase
      .rpc('get_follow_recommendations', {
        user_id: userId,
        recommendation_limit: limit
      })

    if (error) {
      // If RPC doesn't exist, fall back to suggested follows
      console.warn('Follow recommendations RPC not found, using suggested follows')
      return getSuggestedFollows(userId, limit)
    }

    return data || []
  } catch (error) {
    console.error('Get follow recommendations error:', error)
    // Fallback to suggested follows
    return getSuggestedFollows(userId, limit)
  }
}