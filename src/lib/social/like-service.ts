import { supabase } from "@/lib/supabase/client";
import {
  handleDatabaseError,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";
import { getPostById } from "@/lib/posts/post-service";

/**
 * Like a post
 */
export async function likePost(userId: string, postId: string): Promise<void> {
  try {
    // Check if post exists
    const post = await getPostById(postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("user_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (existingLike) {
      throw new ConflictError("Post already liked");
    }

    // Add like
    const { error } = await supabase.from("likes").insert({
      user_id: userId,
      post_id: postId,
    });

    if (error) {
      throw handleDatabaseError(error);
    }
  } catch (error) {
    console.error("Like post error:", error);
    throw error;
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(
  userId: string,
  postId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) {
      throw handleDatabaseError(error);
    }
  } catch (error) {
    console.error("Unlike post error:", error);
    throw error;
  }
}

/**
 * Check if user has liked a post
 */
export async function checkLikeStatus(
  userId: string,
  postId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("likes")
      .select("user_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (error && error.code === "PGRST116") {
      return false; // No like found
    }

    if (error) {
      throw handleDatabaseError(error);
    }

    return !!data;
  } catch (error) {
    console.error("Check like status error:", error);
    throw error;
  }
}

/**
 * Get like status for multiple posts
 */
export async function checkMultipleLikeStatus(
  userId: string,
  postIds: string[]
): Promise<Record<string, boolean>> {
  try {
    if (postIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);

    if (error) {
      throw handleDatabaseError(error);
    }

    const likedPostIds = new Set(data?.map((like) => like.post_id) || []);
    const result: Record<string, boolean> = {};

    postIds.forEach((postId) => {
      result[postId] = likedPostIds.has(postId);
    });

    return result;
  } catch (error) {
    console.error("Check multiple like status error:", error);
    throw error;
  }
}

/**
 * Get posts liked by a user
 */
export async function getUserLikedPosts(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("likes")
      .select(
        `
        created_at,
        post:posts!likes_post_id_fkey (
          *,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url,
            role,
            profile_visibility
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("post.is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleDatabaseError(error);
    }

    const posts =
      data?.map((item) => ({
        ...item.post,
        is_liked_by_user: true,
        liked_at: item.created_at,
      })) || [];

    return {
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error("Get user liked posts error:", error);
    throw error;
  }
}

/**
 * Get users who liked a post
 */
export async function getPostLikers(
  postId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await getPostById(postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const { data, error, count } = await supabase
      .from("likes")
      .select(
        `
        created_at,
        user:profiles!likes_user_id_fkey (
          id,
          username,
          avatar_url,
          bio,
          role,
          profile_visibility
        )
      `,
        { count: "exact" }
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleDatabaseError(error);
    }

    const likers =
      data?.map((item) => ({
        ...item.user,
        liked_at: item.created_at,
      })) || [];

    return {
      likers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error("Get post likers error:", error);
    throw error;
  }
}

/**
 * Get like statistics for a user
 */
export async function getUserLikeStats(userId: string) {
  try {
    // Get total likes given
    const { count: likesGiven, error: likesGivenError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (likesGivenError) {
      throw handleDatabaseError(likesGivenError);
    }

    // Get total likes received (on user's posts)
    const { count: likesReceived, error: likesReceivedError } = await supabase
      .from("likes")
      .select(
        `
        post:posts!likes_post_id_fkey (
          author_id
        )
      `,
        { count: "exact", head: true }
      )
      .eq("post.author_id", userId);

    if (likesReceivedError) {
      throw handleDatabaseError(likesReceivedError);
    }

    return {
      likesGiven: likesGiven || 0,
      likesReceived: likesReceived || 0,
    };
  } catch (error) {
    console.error("Get user like stats error:", error);
    throw error;
  }
}

/**
 * Get trending posts based on recent likes
 */
export async function getTrendingPosts(
  timeframe: "hour" | "day" | "week" = "day",
  limit: number = 20
) {
  try {
    let timeFilter = "";
    const now = new Date();

    switch (timeframe) {
      case "hour":
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case "day":
        timeFilter = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case "week":
        timeFilter = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
    }

    const { data, error } = await supabase
      .from("likes")
      .select(
        `
        post_id,
        post:posts!likes_post_id_fkey (
          *,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url,
            role,
            profile_visibility
          )
        )
      `
      )
      .eq("post.is_active", true)
      .gte("created_at", timeFilter)
      .order("created_at", { ascending: false });

    if (error) {
      throw handleDatabaseError(error);
    }

    // Group by post and count likes
    const postLikeCounts = new Map<string, { post: any; likeCount: number }>();

    data?.forEach((item) => {
      const postId = item.post_id;
      if (postLikeCounts.has(postId)) {
        postLikeCounts.get(postId)!.likeCount++;
      } else {
        postLikeCounts.set(postId, {
          post: item.post,
          likeCount: 1,
        });
      }
    });

    // Sort by like count and return top posts
    const trendingPosts = Array.from(postLikeCounts.values())
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit)
      .map((item) => ({
        ...item.post,
        trending_like_count: item.likeCount,
      }));

    return trendingPosts;
  } catch (error) {
    console.error("Get trending posts error:", error);
    throw error;
  }
}

/**
 * Bulk like operations (for testing or data migration)
 */
export async function bulkLikePosts(
  userId: string,
  postIds: string[]
): Promise<{
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const postId of postIds) {
    try {
      await likePost(userId, postId);
      successful.push(postId);
    } catch (error) {
      failed.push({
        id: postId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { successful, failed };
}
