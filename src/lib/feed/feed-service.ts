import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'
import type { Post } from '@/lib/supabase/types'

/**
 * Get personalized feed for a user (posts from followed users + own posts)
 */
export async function getPersonalizedFeed(userId: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    // First, get the list of users the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (followingError) {
      throw handleDatabaseError(followingError)
    }

    const followingIds = followingData?.map(f => f.following_id) || []
    const allUserIds = [userId, ...followingIds] // Include own posts

    // Get posts from followed users + own posts
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .in('author_id', allUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[] || []

    // Check like status for each post
    if (posts.length > 0) {
      const postIds = posts.map(post => post.id)
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || [])
      posts = posts.map(post => ({
        ...post,
        is_liked_by_user: likedPostIds.has(post.id)
      }))
    }

    return {
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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

    // Get all active posts from public profiles
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('author.profile_visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[] || []

    // Check like status if user is provided
    if (userId && posts.length > 0) {
      const postIds = posts.map(post => post.id)
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || [])
      posts = posts.map(post => ({
        ...post,
        is_liked_by_user: likedPostIds.has(post.id)
      }))
    }

    return {
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get trending feed (posts with high engagement in recent time)
 */
export async function getTrendingFeed(
  userId?: string, 
  timeframe: 'hour' | 'day' | 'week' = 'day',
  page: number = 1, 
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit
    
    // Calculate time filter
    let timeFilter = ''
    const now = new Date()
    
    switch (timeframe) {
      case 'hour':
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        break
      case 'day':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case 'week':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
    }

    // Get posts with engagement score (likes + comments)
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('author.profile_visibility', 'public')
      .gte('created_at', timeFilter)
      .order('like_count', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[] || []

    // Check like status if user is provided
    if (userId && posts.length > 0) {
      const postIds = posts.map(post => post.id)
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || [])
      posts = posts.map(post => ({
        ...post,
        is_liked_by_user: likedPostIds.has(post.id),
        engagement_score: (post.like_count || 0) + (post.comment_count || 0)
      }))
    }

    return {
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit,
      timeframe
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get category-specific feed
 */
export async function getCategoryFeed(
  category: 'general' | 'announcement' | 'question',
  userId?: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('category', category)
      .eq('author.profile_visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[] || []

    // Check like status if user is provided
    if (userId && posts.length > 0) {
      const postIds = posts.map(post => post.id)
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || [])
      posts = posts.map(post => ({
        ...post,
        is_liked_by_user: likedPostIds.has(post.id)
      }))
    }

    return {
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit,
      category
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get feed with advanced filtering and sorting options
 */
export async function getAdvancedFeed(options: {
  userId?: string
  feedType?: 'personalized' | 'public' | 'trending' | 'category'
  category?: 'general' | 'announcement' | 'question'
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'all'
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'trending'
  authorIds?: string[]
  excludeAuthorIds?: string[]
  page?: number
  limit?: number
}) {
  try {
    const {
      userId,
      feedType = 'public',
      category,
      timeframe = 'all',
      sortBy = 'newest',
      authorIds,
      excludeAuthorIds,
      page = 1,
      limit = 20
    } = options

    // Route to specific feed functions based on type
    switch (feedType) {
      case 'personalized':
        if (!userId) throw new Error('User ID required for personalized feed')
        return getPersonalizedFeed(userId, page, limit)
      
      case 'trending':
        return getTrendingFeed(userId, timeframe as 'hour' | 'day' | 'week', page, limit)
      
      case 'category':
        if (!category) throw new Error('Category required for category feed')
        return getCategoryFeed(category, userId, page, limit)
      
      default:
        return getPublicFeed(userId, page, limit)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get feed statistics for analytics
 */
export async function getFeedStats(userId?: string) {
  try {
    if (userId) {
      // Get following count for the user
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      if (followingError) {
        throw handleDatabaseError(followingError)
      }

      // Get posts count from followed users in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      const followingIds = followingData?.map(f => f.following_id) || []

      let newPostsCount = 0
      if (followingIds.length > 0) {
        const { count, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .in('author_id', followingIds)
          .gte('created_at', yesterday)

        if (postsError) {
          throw handleDatabaseError(postsError)
        }

        newPostsCount = count || 0
      }

      return {
        followingCount: followingCount || 0,
        newPostsLast24h: newPostsCount,
        lastUpdated: new Date().toISOString()
      }
    }

    // Public stats fallback when no userId provided
    const { count: totalPostsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return {
      totalPosts: totalPostsCount || 0,
      totalUsers: totalUsersCount || 0,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    throw error
  }
}

/**
 * Cache management for feed performance
 */
export class FeedCache {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getCacheKey(userId: string, feedType: string, page: number): string {
    return `${userId}-${feedType}-${page}`
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  static clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  static invalidateUserFeed(userId: string): void {
    this.clear(userId)
  }
}

/**
 * Get cached personalized feed with fallback
 */
export async function getCachedPersonalizedFeed(userId: string, page: number = 1, limit: number = 20) {
  const cacheKey = FeedCache.getCacheKey(userId, 'personalized', page)
  const cached = FeedCache.get(cacheKey)
  
  if (cached) {
    return cached
  }

  const result = await getPersonalizedFeed(userId, page, limit)
  FeedCache.set(cacheKey, result)
  
  return result
}