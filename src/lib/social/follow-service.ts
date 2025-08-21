
import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
  if (error) {
    throw handleDatabaseError(error)
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId })
  if (error) {
    throw handleDatabaseError(error)
  }
}
