'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, MessageSquare, Heart, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && !isLoading) {
      window.location.href = '/dashboard'
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-xl">SocialConnect</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Connect with your
              <span className="text-primary"> community</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Share your thoughts, discover new perspectives, and build meaningful connections with people who matter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">Join SocialConnect</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Follow friends and discover new people with shared interests
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Post updates, photos, and thoughts with your community
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Engage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Like, comment, and interact with posts that matter to you
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Discover</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Explore trending topics and discover new content
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2025 SocialConnect. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  )
}