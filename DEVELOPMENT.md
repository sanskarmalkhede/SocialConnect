# Local Development Setup

## Prerequisites
- Node.js 18.x or higher
- NPM 9.x or higher
- A Supabase account for the database

## Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
- Go to your Supabase project
- Open the SQL editor
- Run the database setup script from `database/setup.sql`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── database/           # Database schema and migrations
├── public/            # Static assets
├── src/
│   ├── app/          # Next.js 13 app directory
│   ├── components/   # React components
│   ├── lib/         # Utility functions and services
│   └── types/       # TypeScript type definitions
├── .env.example     # Example environment variables
└── package.json    # Project dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Common Issues

### Authentication Issues
- Ensure your Supabase URL and keys are correct
- Check if email confirmation is enabled in Supabase settings

### Database Issues
- Make sure all migrations have been applied
- Check if RLS policies are properly configured

### Image Upload Issues
- Verify Supabase storage bucket permissions
- Check file size limits in your Supabase settings
