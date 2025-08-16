import { supabase, supabaseAdmin } from "@/lib/supabase/client";
import {
  handleDatabaseError,
  NotFoundError,
  ConflictError,
} from "@/lib/errors";
import type { Profile } from "@/lib/supabase/types";
import type { ProfileFormData } from "@/types";

/**
 * Get profile by user ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        follower_count,
        following_count,
        post_count
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Profile not found
      }
      throw handleDatabaseError(error);
    }

    return data;
  } catch (error) {
    console.error("Get profile by ID error:", error);
    throw error;
  }
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        follower_count,
        following_count,
        post_count
      `
      )
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Profile not found
      }
      throw handleDatabaseError(error);
    }

    return data;
  } catch (error) {
    console.error("Get profile by username error:", error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  profileData: ProfileFormData
): Promise<Profile> {
  try {
    // Check if username is already taken by another user
    if (profileData.username) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", profileData.username)
        .neq("id", userId)
        .single();

      if (existingProfile) {
        throw new ConflictError("Username is already taken");
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: profileData.username,
        bio: profileData.bio || null,
        website: profileData.website || null,
        location: profileData.location || null,
        profile_visibility: profileData.profile_visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(
        `
        *,
        follower_count,
        following_count,
        post_count
      `
      )
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    if (!data) {
      throw new NotFoundError("Profile not found");
    }

    return data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
}

/**
 * Update profile avatar URL
 */
export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string
): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(
        `
        *,
        follower_count,
        following_count,
        post_count
      `
      )
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    if (!data) {
      throw new NotFoundError("Profile not found");
    }

    return data;
  } catch (error) {
    console.error("Update profile avatar error:", error);
    throw error;
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from("profiles")
      .select("username")
      .eq("username", username);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query.single();

    if (error && error.code === "PGRST116") {
      return true; // Username not found, so it's available
    }

    if (error) {
      throw handleDatabaseError(error);
    }

    return !data; // If data exists, username is taken
  } catch (error) {
    console.error("Check username availability error:", error);
    throw error;
  }
}

/**
 * Get user's followers
 */
export async function getProfileFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("follows")
      .select(
        `
        follower_id,
        created_at,
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          avatar_url,
          bio,
          profile_visibility
        )
      `,
        { count: "exact" }
      )
      .eq("following_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleDatabaseError(error);
    }

    return {
      followers:
        data?.map((item) => ({
          ...item.follower,
          followed_at: item.created_at,
        })) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Get profile followers error:", error);
    throw error;
  }
}

/**
 * Get users that the profile is following
 */
export async function getProfileFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("follows")
      .select(
        `
        following_id,
        created_at,
        following:profiles!follows_following_id_fkey (
          id,
          username,
          avatar_url,
          bio,
          profile_visibility
        )
      `,
        { count: "exact" }
      )
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleDatabaseError(error);
    }

    return {
      following:
        data?.map((item) => ({
          ...item.following,
          followed_at: item.created_at,
        })) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Get profile following error:", error);
    throw error;
  }
}

/**
 * Check if user is following another user
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();

    if (error && error.code === "PGRST116") {
      return false; // No follow relationship found
    }

    if (error) {
      throw handleDatabaseError(error);
    }

    return !!data;
  } catch (error) {
    console.error("Check is following error:", error);
    throw error;
  }
}

/**
 * Follow a user
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    // Prevent self-following
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const alreadyFollowing = await isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      throw new ConflictError("Already following this user");
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) {
      throw handleDatabaseError(error);
    }
  } catch (error) {
    console.error("Follow user error:", error);
    throw error;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      throw handleDatabaseError(error);
    }
  } catch (error) {
    console.error("Unfollow user error:", error);
    throw error;
  }
}

/**
 * Search profiles by username or bio
 */
export async function searchProfiles(
  query: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    const { data, error, count } = await supabase
      .from("profiles")
      .select(
        `
        *,
        follower_count,
        following_count,
        post_count
      `,
        { count: "exact" }
      )
      .or(`username.ilike.${searchTerm},bio.ilike.${searchTerm}`)
      .eq("profile_visibility", "public") // Only search public profiles
      .order("follower_count", { ascending: false }) // Order by popularity
      .range(offset, offset + limit - 1);

    if (error) {
      throw handleDatabaseError(error);
    }

    return {
      profiles: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("Search profiles error:", error);
    throw error;
  }
}
