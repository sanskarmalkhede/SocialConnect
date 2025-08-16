import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { handleDatabaseError, NotFoundError, AuthorizationError } from '@/lib/errors'
import type { Post } from '@/lib/supabase/types'
import type { PostFormData } from '@/types'

/**
 * Get post by ID with author information
 */
export async function getPostById(postId: string, userId?: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
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
      `)
      .eq('id', postId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Post not found
      }
      throw handleDatabaseError(error)
    }

    // Check if user liked this post
    if (userId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single()

      data.is_liked_by_user = !!likeData
    }

    return data as Post
  } catch (error) {
    console.error('Get post by ID error:', error)
    throw error
  }
}

/**
 * Get posts with pagination and filtering
 */
export async function getPosts(options: {
  page?: number
  limit?: number
  authorId?: string
  category?: 'general' | 'announcement' | 'question'
  userId?: string // For checking like status
} = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      authorId,
      category,
      userId
    } = options

    const offset = (page - 1) * limit

    let query = supabase
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

    // Apply filters
    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Order by creation date (newest first)
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[]

    // Check like status for each post if user is provided
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
    console.error('Get posts error:', error)
    throw error
  }
}

/**
 * Create a new post
 */
export async function createPost(authorId: string, postData: PostFormData): Promise<Post> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: postData.content,
        image_url: postData.image_url || null,
        author_id: authorId,
        category: postData.category
      })
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    return data as Post
  } catch (error) {
    console.error('Create post error:', error)
    throw error
  }
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string, 
  authorId: string, 
  postData: Partial<PostFormData>
): Promise<Post> {
  try {
    // First check if post exists and user owns it
    const existingPost = await getPostById(postId)
    if (!existingPost) {
      throw new NotFoundError('Post not found')
    }

    if (existingPost.author_id !== authorId) {
      throw new AuthorizationError('You can only edit your own posts')
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (postData.content !== undefined) updateData.content = postData.content
    if (postData.image_url !== undefined) updateData.image_url = postData.image_url
    if (postData.category !== undefined) updateData.category = postData.category

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('author_id', authorId) // Double-check ownership
      .select(`
        *,
        author:profiles!posts_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    return data as Post
  } catch (error) {
    console.error('Update post error:', error)
    throw error
  }
}

/**
 * Delete a post (soft delete)
 */
export async function deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
  try {
    // Check if post exists
    const existingPost = await getPostById(postId)
    if (!existingPost) {
      throw new NotFoundError('Post not found')
    }

    // Check authorization
    if (!isAdmin && existingPost.author_id !== userId) {
      throw new AuthorizationError('You can only delete your own posts')
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
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
    console.error('Delete post error:', error)
    throw error
  }
}

/**
 * Like a post
 */
export async function likePost(userId: string, postId: string): Promise<void> {
  try {
    // Check if post exists
    const post = await getPostById(postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      return // Already liked, do nothing
    }

    // Add like
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: userId,
        post_id: postId
      })

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Like post error:', error)
    throw error
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(userId: string, postId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    if (error) {
      throw handleDatabaseError(error)
    }
  } catch (error) {
    console.error('Unlike post error:', error)
    throw error
  }
}

/**
 * Get like status for a post
 */
export async function getPostLikeStatus(userId: string, postId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (error && error.code === 'PGRST116') {
      return false // No like found
    }

    if (error) {
      throw handleDatabaseError(error)
    }

    return !!data
  } catch (error) {
    console.error('Get post like status error:', error)
    throw error
  }
}

/**
 * Get posts for user feed (posts from followed users + own posts)
 */
export async function getFeedPosts(userId: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

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
      .or(`author_id.eq.${userId},author_id.in.(${await getFollowingIds(userId)})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[]

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
    console.error('Get feed posts error:', error)
    throw error
  }
}

/**
 * Helper function to get IDs of users that the current user is following
 */
async function getFollowingIds(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }

    const ids = data?.map(follow => follow.following_id) || []
    return ids.length > 0 ? ids.join(',') : 'null' // Return 'null' if no following
  } catch (error) {
    console.error('Get following IDs error:', error)
    return 'null'
  }
}

/**
 * Search posts by content
 */
export async function searchPosts(
  query: string, 
  options: {
    page?: number
    limit?: number
    category?: 'general' | 'announcement' | 'question'
    userId?: string
  } = {}
) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      userId
    } = options

    const offset = (page - 1) * limit
    const searchTerm = `%${query}%`

    let dbQuery = supabase
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
      .ilike('content', searchTerm)

    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      throw handleDatabaseError(error)
    }

    let posts = data as Post[]

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
    console.error('Search posts error:', error)
    throw error
  }
}