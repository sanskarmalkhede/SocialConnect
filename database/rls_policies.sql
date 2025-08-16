-- Row Level Security Policies for SocialConnect
-- Run this script after setting up the database schema

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (profile_visibility = 'public');

-- Users can view their own profile regardless of visibility
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Followers can view followers_only profiles
CREATE POLICY "Followers can view followers_only profiles" ON profiles
  FOR SELECT USING (
    profile_visibility = 'followers_only' AND
    EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() AND following_id = profiles.id
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but needed for RLS)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- POSTS TABLE POLICIES
-- ============================================================================

-- Active posts are viewable by everyone
CREATE POLICY "Active posts are viewable by everyone" ON posts
  FOR SELECT USING (is_active = true);

-- Users can view their own posts (even if inactive)
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = author_id);

-- Admins can view all posts
CREATE POLICY "Admins can view all posts" ON posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Users can create their own posts
CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Admins can update any post
CREATE POLICY "Admins can update any post" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Admins can delete any post
CREATE POLICY "Admins can delete any post" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- FOLLOWS TABLE POLICIES
-- ============================================================================

-- Users can view follows where they are involved (as follower or following)
CREATE POLICY "Users can view their own follows" ON follows
  FOR SELECT USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
  );

-- Public profiles' follows are viewable by everyone
CREATE POLICY "Public profiles follows are viewable" ON follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = following_id AND profile_visibility = 'public'
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = follower_id AND profile_visibility = 'public'
    )
  );

-- Users can create follows where they are the follower
CREATE POLICY "Users can create their own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete follows where they are the follower
CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Admins can view all follows
CREATE POLICY "Admins can view all follows" ON follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- LIKES TABLE POLICIES
-- ============================================================================

-- Users can view likes on posts they can see
CREATE POLICY "Users can view likes on visible posts" ON likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = likes.post_id AND posts.is_active = true
    )
  );

-- Users can view their own likes
CREATE POLICY "Users can view their own likes" ON likes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all likes
CREATE POLICY "Admins can view all likes" ON likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

-- Active comments on active posts are viewable by everyone
CREATE POLICY "Active comments are viewable" ON comments
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id AND posts.is_active = true
    )
  );

-- Users can view their own comments (even if inactive)
CREATE POLICY "Users can view their own comments" ON comments
  FOR SELECT USING (auth.uid() = author_id);

-- Users can create comments on active posts
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id AND posts.is_active = true
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Post authors can delete comments on their posts
CREATE POLICY "Post authors can delete comments on their posts" ON comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id AND posts.author_id = auth.uid()
    )
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Admins can update any comment
CREATE POLICY "Admins can update any comment" ON comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- System can create notifications (handled by triggers)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = recipient_id);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS FOR COMPLEX VISIBILITY CHECKS
-- ============================================================================

-- Function to check if a user can view a profile
CREATE OR REPLACE FUNCTION can_view_profile(profile_id UUID, viewer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_visibility TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get profile visibility
  SELECT p.profile_visibility INTO profile_visibility
  FROM profiles p WHERE p.id = profile_id;
  
  -- Check if viewer is admin
  SELECT (role = 'admin') INTO is_admin
  FROM profiles WHERE id = viewer_id;
  
  -- Admin can view all profiles
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Owner can view their own profile
  IF profile_id = viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Public profiles are viewable by everyone
  IF profile_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Followers_only profiles are viewable by followers
  IF profile_visibility = 'followers_only' THEN
    RETURN EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = viewer_id AND following_id = profile_id
    );
  END IF;
  
  -- Private profiles are only viewable by owner and admin
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;