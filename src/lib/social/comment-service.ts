import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { getPostById } from '@/lib/posts/post-service'
import type { Comment } from '@/lib/supabase/types'

/**
 * Create a comment on a post
 */
export async function createComment(authorId: string, postId: string, content: string): Promise<Comment> {
  try {
    // Check if post exists
    const post = await getPostById(postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    // Create comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim()
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
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

    return data as Comment
  } catch (error) {
    console.error('Create comment error:', error)
    throw error
  }
}

/**
 * Get comment by ID
 */
export async function getCommentById(commentId: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        ),
        post:posts!comments_post_id_fkey (
          id,
          content,
          author_id
        )
      `)
      .eq('id', commentId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Comment not found
      }
      throw handleDatabaseError(error)
    }

    return data as Comment
  } catch (error) {
    console.error('Get comment by ID error:', error)
    throw error
  }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    // Check if post exists
    const post = await getPostById(postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        )
      `, { count: 'exact' })
      .eq('post_id', postId)
      .eq('is_active', true)
      .order('created_at', { ascending: true }) // Oldest first for comments
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      comments: data as Comment[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    console.error('Get post comments error:', error)
    throw error
  }
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, authorId: string, content: string): Promise<Comment> {
  try {
    // Check if comment exists and user owns it
    const existingComment = await getCommentById(commentId)
    if (!existingComment) {
      throw new NotFoundError('Comment not found')
    }

    if (existingComment.author_id !== authorId) {
      throw new AuthorizationError('You can only edit your own comments')
    }

    const { data, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('author_id', authorId) // Double-check ownership
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
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

    return data as Comment
  } catch (error) {
    console.error('Update comment error:', error)
    throw error
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: string, userId: string, isAdmin: boolean = false): Promise<void> {
  try {
    // Get comment with post information
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select(`
        *,
        post:posts!comments_post_id_fkey (
          id,
          author_id
        )
      `)
      .eq('id', commentId)
      .single()

    if (commentError) {
      if (commentError.code === 'PGRST116') {
        throw new NotFoundError('Comment not found')
      }
      throw handleDatabaseError(commentError)
    }

    // Check authorization: user can delete their own comments, post authors can delete comments on their posts, admins can delete any comment
    const canDelete = 
      comment.author_id === userId || // Own comment
      comment.post.author_id === userId || // Comment on own post
      isAdmin // Admin

    if (!canDelete) {
      throw new AuthorizationError('You can only delete your own comments or comments on your posts')
    }

    // Soft delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ 
        is_active: false,
        content: '[deleted]' // Optional: replace content
      })
      .eq('id', commentId)

    if (deleteError) {
      throw handleDatabaseError(deleteError)
    }
  } catch (error) {
    console.error('Delete comment error:', error)
    throw error
  }
}

/**
 * Get comments by a user
 */
export async function getUserComments(userId: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        ),
        post:posts!comments_post_id_fkey (
          id,
          content,
          author_id,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url
          )
        )
      `, { count: 'exact' })
      .eq('author_id', userId)
      .eq('is_active', true)
      .eq('post.is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      comments: data as Comment[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    console.error('Get user comments error:', error)
    throw error
  }
}

/**
 * Get comment statistics for a user
 */
export async function getUserCommentStats(userId: string) {
  try {
    // Get total comments made
    const { count: commentsMade, error: commentsMadeError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('is_active', true)

    if (commentsMadeError) {
      throw handleDatabaseError(commentsMadeError)
    }

    // Get total comments received (on user's posts)
    const { count: commentsReceived, error: commentsReceivedError } = await supabase
      .from('comments')
      .select(`
        post:posts!comments_post_id_fkey (
          author_id
        )
      `, { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('post.author_id', userId)
      .eq('post.is_active', true)

    if (commentsReceivedError) {
      throw handleDatabaseError(commentsReceivedError)
    }

    return {
      commentsMade: commentsMade || 0,
      commentsReceived: commentsReceived || 0
    }
  } catch (error) {
    console.error('Get user comment stats error:', error)
    throw error
  }
}

/**
 * Search comments by content
 */
export async function searchComments(
  query: string, 
  options: {
    page?: number
    limit?: number
    authorId?: string
    postId?: string
  } = {}
) {
  try {
    const {
      page = 1,
      limit = 20,
      authorId,
      postId
    } = options

    const offset = (page - 1) * limit
    const searchTerm = `%${query}%`

    let dbQuery = supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        ),
        post:posts!comments_post_id_fkey (
          id,
          content,
          author_id
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('post.is_active', true)
      .ilike('content', searchTerm)

    if (authorId) {
      dbQuery = dbQuery.eq('author_id', authorId)
    }

    if (postId) {
      dbQuery = dbQuery.eq('post_id', postId)
    }

    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      throw handleDatabaseError(error)
    }

    return {
      comments: data as Comment[] || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    }
  } catch (error) {
    console.error('Search comments error:', error)
    throw error
  }
}

/**
 * Get recent comments across the platform (for admin/moderation)
 */
export async function getRecentComments(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey (
          id,
          username,
          avatar_url,
          role,
          profile_visibility
        ),
        post:posts!comments_post_id_fkey (
          id,
          content,
          author_id,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('is_active', true)
      .eq('post.is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw handleDatabaseError(error)
    }

    return data as Comment[] || []
  } catch (error) {
    console.error('Get recent comments error:', error)
    throw error
  }
}

/**
 * Bulk delete comments (for moderation)
 */
export async function bulkDeleteComments(commentIds: string[], userId: string, isAdmin: boolean = false): Promise<{
  successful: string[]
  failed: Array<{ id: string; error: string }>
}> {
  const successful: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const commentId of commentIds) {
    try {
      await deleteComment(commentId, userId, isAdmin)
      successful.push(commentId)
    } catch (error) {
      failed.push({
        id: commentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { successful, failed }
}