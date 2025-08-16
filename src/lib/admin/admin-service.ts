import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { handleDatabaseError, NotFoundError, AuthorizationError } from '@/lib/errors'
import type { Profile, Post } from '@/lib/supabase/types'

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    return data?.role === 'admin'
  } catch (error) {
    console.error('Check admin status error:', error)
    return false
  }
}

/**
 * Get all users with pagination and search
 */
export async function getUsers(options: {
  page?: number
  limit?: number
  search?: string
  role?: 'user' | 'admin'
  sortBy?: 'created_at' | 'username' | 'post_count' | 'follower_count'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        _count_posts:posts(count),
        _count_followers:follows!follows_following_id_fkey(count),
        _count_following:follows!follows_follower_id_fkey(count)
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      users: data as Profile[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    console.error('Get users error:', error)
    throw error
  }
}

/**
 * Get user details by ID (admin view)
 */
export async function getUserDetails(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        posts(count),
        followers:follows!follows_following_id_fkey(count),
        following:follows!follows_follower_id_fkey(count),
        likes_given:likes(count),
        comments_made:comments(count)
      `)
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('User not found')
      }
      throw handleDatabaseError(error)
    }

    return data
  } catch (error) {
    console.error('Get user details error:', error)
    throw error
  }
}

/**
 * Deactivate/reactivate user account
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  try {
    // For now, we'll use a custom field. In production, you might want to use Supabase Auth admin functions
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }

    // If deactivating, also deactivate their posts
    if (!isActive) {
      await supabaseAdmin
        .from('posts')
        .update({ is_active: false })
        .eq('author_id', userId)
    }
  } catch (error) {
    console.error('Toggle user status error:', error)
    throw error
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Update user role error:', error)
    throw error
  }
}

/**
 * Get all posts with moderation info
 */
export async function getPostsForModeration(options: {
  page?: number
  limit?: number
  search?: string
  category?: 'general' | 'announcement' | 'question'
  isActive?: boolean
  sortBy?: 'created_at' | 'like_count' | 'comment_count'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role
        ),
        _count_likes:likes(count),
        _count_comments:comments(count)
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      posts: data as Post[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    console.error('Get posts for moderation error:', error)
    throw error
  }
}

/**
 * Delete post (admin action)
 */
export async function deletePostAsAdmin(postId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Delete post as admin error:', error)
    throw error
  }
}

/**
 * Restore post (admin action)
 */
export async function restorePostAsAdmin(postId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Restore post as admin error:', error)
    throw error
  }
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  try {
    // Get user counts
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      throw handleDatabaseError(usersError)
    }

    const { count: activeUsers, error: activeUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeUsersError) {
      throw handleDatabaseError(activeUsersError)
    }

    // Get post counts
    const { count: totalPosts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })

    if (postsError) {
      throw handleDatabaseError(postsError)
    }

    const { count: activePosts, error: activePostsError } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activePostsError) {
      throw handleDatabaseError(activePostsError)
    }

    // Get engagement counts
    const { count: totalLikes, error: likesError } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })

    if (likesError) {
      throw handleDatabaseError(likesError)
    }

    const { count: totalComments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (commentsError) {
      throw handleDatabaseError(commentsError)
    }

    const { count: totalFollows, error: followsError } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })

    if (followsError) {
      throw handleDatabaseError(followsError)
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count: newUsersToday, error: newUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday)

    if (newUsersError) {
      throw handleDatabaseError(newUsersError)
    }

    const { count: newPostsToday, error: newPostsError } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday)
      .eq('is_active', true)

    if (newPostsError) {
      throw handleDatabaseError(newPostsError)
    }

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        newToday: newUsersToday || 0
      },
      posts: {
        total: totalPosts || 0,
        active: activePosts || 0,
        newToday: newPostsToday || 0
      },
      engagement: {
        totalLikes: totalLikes || 0,
        totalComments: totalComments || 0,
        totalFollows: totalFollows || 0
      },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Get platform stats error:', error)
    throw error
  }
}

/**
 * Get user activity timeline
 */
export async function getUserActivityTimeline(userId: string, limit: number = 50) {
  try {
    // Get recent posts
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('id, content, created_at, category, is_active')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit / 2)

    if (postsError) {
      throw handleDatabaseError(postsError)
    }

    // Get recent comments
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select(`
        id, content, created_at, is_active,
        post:posts(id, content)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit / 2)

    if (commentsError) {
      throw handleDatabaseError(commentsError)
    }

    // Combine and sort activities
    const activities = [
      ...(posts || []).map(post => ({
        type: 'post' as const,
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        is_active: post.is_active,
        category: post.category
      })),
      ...(comments || []).map(comment => ({
        type: 'comment' as const,
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        is_active: comment.is_active,
        post: comment.post
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return activities.slice(0, limit)
  } catch (error) {
    console.error('Get user activity timeline error:', error)
    throw error
  }
}

/**
 * Bulk user operations
 */
export async function bulkUpdateUsers(
  userIds: string[], 
  updates: { role?: 'user' | 'admin'; is_active?: boolean }
): Promise<{ successful: string[]; failed: Array<{ id: string; error: string }> }> {
  const successful: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const userId of userIds) {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw handleDatabaseError(error)
      }

      successful.push(userId)
    } catch (error) {
      failed.push({
        id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { successful, failed }
}

/**
 * Get content moderation queue
 */
export async function getModerationQueue(limit: number = 20) {
  try {
    // Get recently reported content (this would require a reports table in a real app)
    // For now, get recent posts that might need moderation
    const { data: recentPosts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (postsError) {
      throw handleDatabaseError(postsError)
    }

    return recentPosts || []
  } catch (error) {
    console.error('Get moderation queue error:', error)
    throw error
  }
}