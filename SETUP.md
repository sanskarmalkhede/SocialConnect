# SocialConnect Setup Guide

## 🚀 Complete Social Media Platform

SocialConnect is a full-featured social media platform built with Next.js, Supabase, and modern web technologies. This guide will help you set up and run the application.

## ✅ What's Included

### Core Features
- **Authentication System**: Registration, login, password reset, email verification
- **User Profiles**: Customizable profiles with avatars, bios, and privacy settings
- **Post Management**: Create, edit, delete posts with image uploads
- **Social Interactions**: Follow/unfollow, like/unlike, commenting system
- **Real-time Notifications**: Live notifications with browser support
- **Personalized Feed**: Multiple feed types (personalized, public, trending)
- **Admin Dashboard**: Complete admin interface for user and content management
- **Error Handling**: Comprehensive error boundaries and user feedback

### Technical Features
- **Database**: Complete schema with Row Level Security (RLS)
- **Real-time**: Supabase Realtime for live updates
- **File Uploads**: Avatar and post image uploads
- **Validation**: Comprehensive input validation with Zod
- **Security**: JWT authentication, rate limiting, CORS protection
- **UI/UX**: Modern interface with shadcn/ui components
- **Responsive**: Mobile-first responsive design

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Git

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd social-connect

# Install dependencies
npm install

# Install additional required packages
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zod react-hook-form @hookform/resolvers
npm install sonner lucide-react date-fns
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-dropdown-menu @radix-ui/react-form
npm install @radix-ui/react-input @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-skeleton @radix-ui/react-tabs
npm install @radix-ui/react-textarea @radix-ui/react-toast
npm install @radix-ui/react-dialog @radix-ui/react-popover
npm install @radix-ui/react-progress @radix-ui/react-scroll-area
npm install @radix-ui/react-table @radix-ui/react-alert
```

### 2. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Get Your Credentials**
   - Go to Settings > API
   - Copy your Project URL and anon public key

3. **Set Up Environment Variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set Up Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the database setup script:

   ```sql
   -- Copy and paste the contents of database/setup.sql
   -- This will create all tables, indexes, RLS policies, and functions
   ```

   Or run each migration file individually:
   - `database/migrations/001_create_profiles_table.sql`
   - `database/migrations/002_create_posts_table.sql`
   - `database/migrations/003_create_follows_table.sql`
   - `database/migrations/004_create_likes_table.sql`
   - `database/migrations/005_create_comments_table.sql`
   - `database/migrations/006_create_notifications_table.sql`
   - `database/migrations/007_add_post_count_to_profiles.sql`
   - `database/migrations/008_create_bookmarks_table.sql`
   - `database/migrations/009_add_user_status_fields.sql`

5. **Set Up Row Level Security**
   - Run the RLS policies: `database/rls_policies.sql`
   - Test the policies: `database/test_rls.sql` (optional)

6. **Configure Storage (Optional)**
   - Go to Storage in your Supabase dashboard
   - Create buckets for:
     - `avatars` (for profile pictures)
     - `post-images` (for post images)
   - Set up storage policies for public access

7. **Enable Realtime (Optional)**
   - Go to Database > Replication
   - Enable realtime for the `notifications` table

### 3. Run the Application

```bash
# Start the development server
npm run dev

# Open your browser to http://localhost:3000
```

## 🎯 Testing the Application

### 1. Authentication Flow
- Visit `/auth/register` to create an account
- Check your email for verification (if enabled)
- Sign in at `/auth/login`
- Test password reset at `/auth/reset-password`

### 2. Core Features
- **Profile**: Visit `/profile/[username]` to view/edit profiles
- **Posts**: Create posts from the home page
- **Social**: Follow users, like posts, add comments
- **Notifications**: Check `/notifications` for real-time updates
- **Admin**: Access `/admin` with an admin account

### 3. Admin Features
- Create an admin user by updating the `role` field in the database
- Access the admin dashboard at `/admin`
- Test user management and content moderation

## 🔧 Configuration Options

### Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Content Limits (in `src/constants/index.ts`)
```typescript
export const CONTENT_LIMITS = {
  POST_MAX_LENGTH: 280,
  COMMENT_MAX_LENGTH: 200,
  BIO_MAX_LENGTH: 160,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- The app works on any platform that supports Next.js
- Ensure environment variables are properly configured
- Update CORS settings in Supabase for your domain

## 🛠️ Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── posts/          # Post-related components
│   ├── profile/        # Profile components
│   ├── social/         # Social interaction components
│   ├── feed/           # Feed components
│   ├── notifications/  # Notification components
│   ├── admin/          # Admin components
│   ├── error/          # Error handling components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility libraries
│   ├── auth/           # Authentication utilities
│   ├── posts/          # Post services
│   ├── profile/        # Profile services
│   ├── social/         # Social interaction services
│   ├── feed/           # Feed services
│   ├── notifications/  # Notification services
│   ├── admin/          # Admin services
│   ├── validation/     # Validation middleware
│   ├── api/            # API utilities
│   └── supabase/       # Supabase client and types
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

### Key Files
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/lib/supabase/types.ts` - Database type definitions
- `src/lib/validations.ts` - Zod validation schemas
- `src/lib/errors.ts` - Error handling utilities
- `src/constants/index.ts` - Application constants

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify your environment variables
   - Check if your Supabase project is active
   - Ensure RLS policies are properly set up

2. **Authentication Problems**
   - Check email confirmation settings in Supabase Auth
   - Verify JWT secret configuration
   - Ensure auth helpers are properly configured

3. **Database Errors**
   - Run database migrations in order
   - Check RLS policies are enabled
   - Verify foreign key relationships

4. **File Upload Issues**
   - Set up Supabase Storage buckets
   - Configure storage policies
   - Check file size limits

5. **Real-time Not Working**
   - Enable realtime replication in Supabase
   - Check WebSocket connections
   - Verify subscription permissions

### Getting Help
- Check the browser console for errors
- Review Supabase logs in the dashboard
- Ensure all dependencies are installed
- Verify environment variables are correct

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎉 You're Ready!

Your SocialConnect application is now fully set up and ready to use. The platform includes all the features of a modern social media application with real-time capabilities, comprehensive error handling, and a beautiful user interface.

Enjoy building your social community! 🚀