'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedWithTabs } from '@/components/feed/PostFeed'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Home, Search, Bell, User, Settings, LogOut } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/format'
import type { Profile } from '@/lib/supabase/types'

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // In a real app, this would check authentication and load user profile
    // For demo purposes, we'll simulate a logged-in user
    const mockUser: Profile = {
      id: '1',
      username: 'demo_user',
      bio: 'Welcome to SocialConnect!',
      avatar_url: null,
      role: 'user',
      profile_visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 0,
      follower_count: 0,
      following_count: 0
    }
    
    setCurrentUser(mockUser)
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    // In a real app, this would handle logout
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold text-xl">SocialConnect</span>
            </a>
          </div>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button variant="outline" className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64">
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search posts...</span>
                <span className="inline-flex lg:hidden">Search...</span>
              </Button>
            </div>
            
            <nav className="flex items-center space-x-2">
              <NotificationDropdown currentUser={currentUser} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
                      <AvatarFallback>
                        {getInitials(currentUser.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{currentUser.username}</p>
                      {currentUser.bio && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {currentUser.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/profile/${currentUser.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push(`/profile/${currentUser.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/notifications')}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Feed */}
          <div className="lg:col-span-3">
            <FeedWithTabs
              posts={[]} // In a real app, this would be loaded from the API
              currentUser={currentUser}
              isLoading={false}
              onCreatePost={async (data) => {
                console.log('Create post:', data)
                // In a real app, this would call the API
              }}
              onLikePost={async (postId) => {
                console.log('Like post:', postId)
                // In a real app, this would call the API
              }}
              onUnlikePost={async (postId) => {
                console.log('Unlike post:', postId)
                // In a real app, this would call the API
              }}
              onCommentPost={(postId) => {
                console.log('Comment on post:', postId)
                // In a real app, this would navigate to post details
              }}
              onEditPost={(postId) => {
                console.log('Edit post:', postId)
                // In a real app, this would open edit modal
              }}
              onDeletePost={async (postId) => {
                console.log('Delete post:', postId)
                // In a real app, this would call the API
              }}
              onSharePost={(postId) => {
                console.log('Share post:', postId)
                // In a real app, this would handle sharing
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}