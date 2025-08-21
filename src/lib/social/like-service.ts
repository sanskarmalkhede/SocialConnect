import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'

export async function likePost(postId: string, userId: string) {
  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
  if (error) {
    throw handleDatabaseError(error)
  }
}

export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: userId })
  if (error) {
    throw handleDatabaseError(error)
  }
}