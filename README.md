# SocialConnect### Technical Features
- **Error Handling**: Comprehensive error handling with proper error messages
- **Form Validation**: Input validation with Zod schemas
- **Responsive Design**: Mobile-first design approach
- **Type Safety**: Full TypeScript support
- **API Documentation**: Detailed API documentation with examples
- **Security**: Proper authentication and authorizationrn Social Media Platform

A full-featured social media platform built with Next.js 15, Supabase, and TypeScript. Features real-time notifications, admin dashboard, comprehensive error handling, and modern UI components.

## 🚀 Features

### Core Features
- **User Authentication** - Registration, login, password reset with email verification
- **User Profiles** - Customizable profiles with avatar upload and privacy settings
- **Posts & Content** - Create, edit, delete posts with image support and categories
- **Social Interactions** - Like, comment, follow/unfollow users
- **Real-time Notifications** - Live updates for likes, comments, follows
- **Personalized Feed** - Algorithm-based feed with filtering and pagination
- **Bookmarks** - Save posts for later viewing

### Advanced Features
- **Admin Dashboard** - User management, content moderation, platform analytics
- **Instant Updates** - Regular polling for fresh content
- **Comprehensive Error Handling** - Global error boundaries and API error handling
- **Form Validation** - Zod schemas with client and server-side validation
- **Responsive Design** - Mobile-first design with dark/light mode
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support

### Technical Features
- **Type Safety** - Full TypeScript implementation
- **Database Security** - Row Level Security (RLS) policies
- **API Rate Limiting** - Protection against abuse
- **File Upload** - Secure image upload to Supabase Storage
- **Testing** - Unit, integration, and E2E tests
- **Performance** - Optimized queries, caching, and lazy loading

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS, shadcn/ui
- **Updates**: Regular polling and refresh mechanisms
- **Validation**: Zod
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account (free tier available)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd socialconnect-app
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SocialConnect
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database setup script in Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/setup.sql
```

3. Ensure proper indexes are created for the `notifications` table

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Create Admin User

1. Register a new account through the UI
2. In Supabase Dashboard > Authentication > Users, find your user ID
3. Run in SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
```

## 🧪 Testing

### Run Tests

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests**: `src/__tests__/` - Component and utility testing
- **Integration Tests**: `src/__tests__/api/` - API route testing  
- **E2E Tests**: `e2e/` - Full user flow testing

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   ├── posts/            # Post-related components
│   ├── social/           # Social interaction components
│   ├── feed/             # Feed components
│   ├── notifications/    # Notification components
│   ├── admin/            # Admin dashboard components
│   └── error/            # Error handling components
├── lib/                   # Business logic and utilities
│   ├── auth/             # Authentication helpers
│   ├── supabase/         # Database client and types
│   ├── posts/            # Post management
│   ├── social/           # Social features (likes, comments, follows)
│   ├── feed/             # Feed algorithms
│   ├── notifications/    # Notification system
│   ├── admin/            # Admin functionality
│   ├── validation/       # Form validation schemas
│   └── api/              # API utilities
├── __tests__/            # Test files
└── constants/            # App constants
```

## 🔧 Configuration

### Supabase Setup

1. **Authentication Settings**:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: Add production URLs when deploying

2. **Storage Buckets** (optional):
   - `avatars` - User profile pictures
   - `post-images` - Post attachments

3. **Realtime**: Enable for `notifications` table

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase site URL to production domain

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level security
- **Input Validation** - Zod schemas for all inputs
- **Authentication Guards** - Protected routes and API endpoints
- **Rate Limiting** - API abuse protection
- **CORS Protection** - Cross-origin request filtering
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - React's built-in protection

## 📊 Performance Features

- **Database Indexes** - Optimized query performance
- **Pagination** - Efficient data loading
- **Image Optimization** - Next.js automatic optimization
- **Caching** - Strategic caching for better performance
- **Lazy Loading** - Component and route-based code splitting
- **Optimistic Updates** - Better user experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section in `SETUP.md`
- Review the test files for usage examples
- Open an issue for bugs or feature requests

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Content recommendation engine
- [ ] Video post support
- [ ] Direct messaging
- [ ] Groups and communities
- [ ] Advanced moderation tools

---

Built with ❤️ using Next.js and Supabase