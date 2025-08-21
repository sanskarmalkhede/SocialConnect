
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

export async function checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw handleDatabaseError(error);
  }

  return !!data;
}

export async function getSuggestedFollows(userId: string, limit: number = 10) {
  const { data, error } = await supabase.rpc('get_suggested_profiles', { p_user_id: userId, p_limit: limit });

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function getFollowRecommendations(userId: string, limit: number = 10) {
  // This is a placeholder for a more sophisticated recommendation engine.
  // For now, it will return similar results to suggested follows.
  const { data, error } = await supabase.rpc('get_suggested_profiles', { p_user_id: userId, p_limit: limit });

  if (error) {
    throw handleDatabaseError(error);
  }

  return data;
}

export async function getFollowers(userId: string, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from('follows')
    .select(
      `
      follower:profiles!follower_id(*)
      `,
      { count: 'exact' }
    )
    .eq('following_id', userId)
    .range(offset, offset + limit - 1);

  if (error) {
    throw handleDatabaseError(error);
  }

  return { profiles: data.map((f) => f.follower), totalCount: count || 0 };
}

export async function getFollowing(userId: string, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from('follows')
    .select(
      `
      following:profiles!following_id(*)
      `,
      { count: 'exact' }
    )
    .eq('follower_id', userId)
    .range(offset, offset + limit - 1);

  if (error) {
    throw handleDatabaseError(error);
  }

  return { profiles: data.map((f) => f.following), totalCount: count || 0 };
}
