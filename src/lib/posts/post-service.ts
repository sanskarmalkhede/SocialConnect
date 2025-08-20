import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'
import type { Post } from '@/lib/supabase/types'
import type { PostFormData } from '@/types'

/**
 * Create a new post
 */
export async function createPost(data: PostFormData): Promise<Post> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Not authenticated')
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        content: data.content,
        category: data.category || 'general',
        image_url: data.imageUrl,
        author_id: session.user.id,
        is_active: true
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

    return post as Post
  } catch (error) {
    throw error
  }
}
