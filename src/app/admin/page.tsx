'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminStats } from '@/components/admin/AdminStats'
import { UserManagement } from '@/components/admin/UserManagement'
import { PostModeration } from '@/components/admin/PostModeration'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Shield, Users, FileText, BarChart3, ArrowLeft } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // In a real app, this would check authentication and admin role
    // For demo purposes, we'll simulate an admin user
    const mockAdminUser: Profile = {
      id: '1',
      username: 'admin_user',
      bio: 'Platform Administrator',
      avatar_url: null,
      role: 'admin',
      profile_visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 5,
      follower_count: 100,
      following_count: 20
    }
    
    setCurrentUser(mockAdminUser)
    setIsLoading(false)
  }, [])

  const handleUpdateUserRole = async (userId: string, role: 'user' | 'admin') => {
    console.log('Update user role:', userId, role)
    // In a real app, this would call the admin API
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    console.log('Toggle user status:', userId, isActive)
    // In a real app, this would call the admin API
  }

  const handleViewUserDetails = (userId: string) => {
    console.log('View user details:', userId)
    // In a real app, this would navigate to user details page
  }

  const handleDeletePost = async (postId: string) => {
    console.log('Delete post:', postId)
    // In a real app, this would call the admin API
  }

  const handleRestorePost = async (postId: string) => {
    console.log('Restore post:', postId)
    // In a real app, this would call the admin API
  }

  const handleViewPost = (postId: string) => {
    console.log('View post:', postId)
    // In a real app, this would navigate to post details
  }

  const handleRefreshStats = async () => {
    console.log('Refresh stats')
    // In a real app, this would reload statistics
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h1 className="font-semibold">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Platform Statistics</h2>
              <p className="text-muted-foreground mb-6">
                Overview of platform health and user activity
              </p>
            </div>
            
            <AdminStats onRefresh={handleRefreshStats} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">User Management</h2>
              <p className="text-muted-foreground mb-6">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            
            <UserManagement
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUserStatus={handleToggleUserStatus}
              onViewUserDetails={handleViewUserDetails}
            />
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Content Moderation</h2>
              <p className="text-muted-foreground mb-6">
                Review and moderate user-generated content
              </p>
            </div>
            
            <PostModeration
              onDeletePost={handleDeletePost}
              onRestorePost={handleRestorePost}
              onViewPost={handleViewPost}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}