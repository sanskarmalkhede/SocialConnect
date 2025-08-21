import { supabase } from '@/lib/supabase/client'
import { handleDatabaseError } from '@/lib/errors'
import type { Post } from '@/types'
import type { PostFormData } from '@/types'

interface GetPostsOptions {
  page?: number;
  limit?: number;
  authorId?: string;
  category?: 'general' | 'announcement' | 'question';
  userId?: string; // Current user ID for like status
}

export async function getPosts(options: GetPostsOptions): Promise<{ posts: Post[]; totalCount: number }> {
  const { page = 1, limit = 20, authorId, category, userId } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!author_id(*),
      likes(user_id)
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query;

  if (error) {
    throw handleDatabaseError(error);
  }

  const postsWithLikeStatus = data.map((post) => ({
    ...post,
    is_liked_by_user: userId ? post.likes.some((like) => like.user_id === userId) : false,
  }));

  return { posts: postsWithLikeStatus as Post[], totalCount: count || 0 };
}

export async function getPostById(postId: string, userId?: string): Promise<Post | null> {
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!author_id(*),
      likes(user_id)
      `
    )
    .eq('id', postId)
    .single();

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      return null;
    }
    throw handleDatabaseError(error);
  }

  const postWithLikeStatus = {
    ...data,
    is_liked_by_user: userId ? data.likes.some((like) => like.user_id === userId) : false,
  };

  return postWithLikeStatus as Post;
}

export async function updatePost(postId: string, userId: string, postData: Partial<PostFormData>): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update(postData)
    .eq('id', postId)
    .eq('author_id', userId) // Ensure only author can update
    .select('*, author:profiles!author_id(*)')
    .single();

  if (error) {
    throw handleDatabaseError(error);
  }
  return data as Post;
}

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

export async function deletePost(postId: string, userId: string, isAdmin: boolean) {
  let query = supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId);

  if (!isAdmin) {
    query = query.eq('author_id', userId);
  }

  const { error } = await query;

  if (error) {
    throw handleDatabaseError(error);
  }
}

export async function getPostLikeStatus(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw handleDatabaseError(error);
  }

  return !!data;
}