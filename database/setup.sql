-- SocialConnect Database Setup
-- Run this script in your Supabase SQL editor to set up the complete database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table
\i 001_create_profiles_table.sql

-- 2. Create posts table
\i 002_create_posts_table.sql

-- 3. Create follows table
\i 003_create_follows_table.sql

-- 4. Create likes table
\i 004_create_likes_table.sql

-- 5. Create comments table
\i 005_create_comments_table.sql

-- 6. Create notifications table
\i 006_create_notifications_table.sql

-- 7. Add post count to profiles
\i 007_add_post_count_to_profiles.sql

-- Add user status fields
\i 009_add_user_status_fields.sql

-- Create a view for feed queries with user information
CREATE OR REPLACE VIEW feed_posts AS
SELECT 
  p.*,
  author.username as author_username,
  author.avatar_url as author_avatar_url,
  author.role as author_role
FROM posts p
JOIN profiles author ON p.author_id = author.id
WHERE p.is_active = true
ORDER BY p.created_at DESC;

-- Create a view for comments with user information
CREATE OR REPLACE VIEW post_comments AS
SELECT 
  c.*,
  author.username as author_username,
  author.avatar_url as author_avatar_url,
  author.role as author_role
FROM comments c
JOIN profiles author ON c.author_id = author.id
WHERE c.is_active = true
ORDER BY c.created_at ASC;

-- Create a view for notifications with sender information
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
  n.*,
  sender.username as sender_username,
  sender.avatar_url as sender_avatar_url
FROM notifications n
JOIN profiles sender ON n.sender_id = sender.id
ORDER BY n.created_at DESC;