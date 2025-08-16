-- Test script for Row Level Security policies
-- Run this script to test that RLS policies are working correctly

-- Create test users (run these in Supabase Auth, not SQL)
-- User 1: test1@example.com (regular user)
-- User 2: test2@example.com (regular user) 
-- User 3: admin@example.com (admin user)

-- Test data setup (run as service role)
BEGIN;

-- Insert test profiles
INSERT INTO profiles (id, username, role, profile_visibility) VALUES
  ('11111111-1111-1111-1111-111111111111', 'testuser1', 'user', 'public'),
  ('22222222-2222-2222-2222-222222222222', 'testuser2', 'user', 'private'),
  ('33333333-3333-3333-3333-333333333333', 'adminuser', 'admin', 'public'),
  ('44444444-4444-4444-4444-444444444444', 'followeruser', 'user', 'followers_only');

-- Insert test posts
INSERT INTO posts (id, content, author_id, category) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Public post by user1', '11111111-1111-1111-1111-111111111111', 'general'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Private user post', '22222222-2222-2222-2222-222222222222', 'general'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Admin post', '33333333-3333-3333-3333-333333333333', 'announcement');

-- Insert test follow relationship
INSERT INTO follows (follower_id, following_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444');

-- Insert test likes
INSERT INTO likes (user_id, post_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Insert test comments
INSERT INTO comments (id, post_id, author_id, content) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Nice post!');

COMMIT;

-- Test queries (run these with different user contexts)

-- Test 1: Profile visibility
-- As anonymous user, should only see public profiles
SELECT username, profile_visibility FROM profiles;

-- Test 2: Post visibility  
-- As anonymous user, should see all active posts
SELECT content, author_id FROM posts WHERE is_active = true;

-- Test 3: Follow visibility
-- As user1, should see follows involving user1
-- SET LOCAL rls.user_id = '11111111-1111-1111-1111-111111111111';
SELECT * FROM follows;

-- Test 4: Like visibility
-- As user1, should see likes on visible posts and own likes
-- SET LOCAL rls.user_id = '11111111-1111-1111-1111-111111111111';
SELECT * FROM likes;

-- Test 5: Comment visibility
-- As anonymous user, should see active comments on active posts
SELECT content, author_id FROM comments WHERE is_active = true;

-- Test 6: Notification visibility
-- As user1, should only see own notifications
-- SET LOCAL rls.user_id = '11111111-1111-1111-1111-111111111111';
SELECT * FROM notifications;

-- Test 7: Admin access
-- As admin, should see all data
-- SET LOCAL rls.user_id = '33333333-3333-3333-3333-333333333333';
SELECT 'Admin can see all profiles:' as test;
SELECT username, profile_visibility FROM profiles;

SELECT 'Admin can see all posts:' as test;
SELECT content, is_active FROM posts;

-- Cleanup test data
-- DELETE FROM notifications WHERE recipient_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM comments WHERE author_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM likes WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM follows WHERE follower_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM posts WHERE author_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
-- DELETE FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');