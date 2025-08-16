# SocialConnect Database Setup

This directory contains all the SQL scripts needed to set up the SocialConnect database schema and security policies.

## Quick Setup

1. **Run the main setup script** in your Supabase SQL Editor:
   ```sql
   -- Copy and paste the contents of setup.sql
   ```

2. **Apply Row Level Security policies**:
   ```sql
   -- Copy and paste the contents of rls_policies.sql
   ```

## Manual Setup (Step by Step)

If you prefer to run migrations individually:

### 1. Database Schema
Run these files in order:

1. `001_create_profiles_table.sql` - User profiles with auto-creation trigger
2. `002_create_posts_table.sql` - Posts with categories and metadata
3. `003_create_follows_table.sql` - Follow relationships with count updates
4. `004_create_likes_table.sql` - Post likes with count updates
5. `005_create_comments_table.sql` - Post comments with count updates
6. `006_create_notifications_table.sql` - Real-time notifications
7. `007_add_post_count_to_profiles.sql` - Post count tracking

### 2. Row Level Security
Run `rls_policies.sql` to enable RLS and create security policies.

### 3. Testing (Optional)
Run `test_rls.sql` to verify that RLS policies are working correctly.

## Database Schema Overview

### Tables

- **profiles** - User profiles (extends auth.users)
  - Automatic profile creation on user signup
  - Username uniqueness constraints
  - Profile visibility settings (public/private/followers_only)
  - Follower/following/post counts

- **posts** - User posts
  - Content with 280 character limit
  - Optional image attachments
  - Categories (general/announcement/question)
  - Like and comment counts
  - Soft delete with is_active flag

- **follows** - Follow relationships
  - Prevents self-following
  - Automatic count updates via triggers

- **likes** - Post likes
  - Prevents duplicate likes
  - Automatic count updates via triggers

- **comments** - Post comments
  - 200 character limit
  - Soft delete support
  - Automatic count updates via triggers

- **notifications** - Real-time notifications
  - Auto-generated for follows, likes, comments
  - Read/unread status tracking

### Key Features

- **Automatic Triggers**: Count updates, notification creation, profile creation
- **Row Level Security**: Comprehensive access control based on user roles and relationships
- **Performance Indexes**: Optimized for common query patterns
- **Data Integrity**: Foreign key constraints and check constraints
- **Soft Deletes**: Posts and comments support soft deletion

### Views

- **feed_posts** - Posts with author information for feed queries
- **post_comments** - Comments with author information
- **user_notifications** - Notifications with sender information

## Security Policies

### Profile Access
- Public profiles: Viewable by everyone
- Private profiles: Only viewable by owner and admins
- Followers-only profiles: Viewable by followers, owner, and admins

### Post Access
- Active posts: Viewable by everyone
- Users can only modify their own posts
- Admins can modify/delete any post

### Social Features
- Users can only create follows/likes/comments for themselves
- Users can delete their own content
- Post authors can delete comments on their posts

### Admin Privileges
- Admins can view and modify all content
- Admin role is checked via profiles.role = 'admin'

## Environment Setup

Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Storage Buckets

Create these storage buckets in Supabase:
- `avatars` - For user profile pictures
- `post-images` - For post image attachments

Set appropriate RLS policies on storage buckets to match the application's access patterns.