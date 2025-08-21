import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'
import type { Post } from '@/types'
import type { PostFormData } from '@/types'

export async function createPost(postData: PostFormData, userId: string): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...postData, author_id: userId })
    .select('*, author:profiles!author_id(*)')
    .single()

  if (error) {
    throw handleDatabaseError(error)
  }
  return data as Post
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().match({ id: postId })
  if (error) {
    throw handleDatabaseError(error)
  }
}