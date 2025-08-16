'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    // In a real app, this would load the profile and current user from the API
    // For demo purposes, we'll simulate data
    const mockProfile: Profile = {
      id: username === 'demo_user' ? '1' : '2',
      username: username,
      bio: username === 'demo_user' ? 'Welcome to SocialConnect!' : 'Another user on SocialConnect',
      avatar_url: null,
      role: 'user',
      profile_visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: Math.floor(Math.random() * 50),
      follower_count: Math.floor(Math.random() * 200),
      following_count: Math.floor(Math.random() * 100)
    }

    const mockCurrentUser: Profile = {
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

    setProfile(mockProfile)
    setCurrentUser(mockCurrentUser)
    setIsFollowing(Math.random() > 0.5) // Random follow status for demo
    setIsLoading(false)
  }, [username])

  const handleFollow = async () => {
    console.log('Follow user:', profile?.id)
    setIsFollowing(true)
    // In a real app, this would call the API
  }

  const handleUnfollow = async () => {
    console.log('Unfollow user:', profile?.id)
    setIsFollowing(false)
    // In a real app, this would call the API
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async (data: any) => {
    console.log('Save profile:', data)
    // In a real app, this would call the API
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="ml-4">
            <h1 className="font-semibold">{profile.username}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-6">
          {isEditing ? (
            <ProfileForm
              profile={profile}
              onSubmit={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={false}
              isEditing={true}
            />
          ) : (
            <>
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEditProfile={handleEditProfile}
                isLoading={false}
              />

              <ProfileTabs
                profile={profile}
                isOwnProfile={isOwnProfile}
                posts={[]} // In a real app, this would be loaded from the API
                followers={[]} // In a real app, this would be loaded from the API
                following={[]} // In a real app, this would be loaded from the API
                isLoading={false}
                onLoadMorePosts={() => console.log('Load more posts')}
                onLoadMoreFollowers={() => console.log('Load more followers')}
                onLoadMoreFollowing={() => console.log('Load more following')}
                hasMorePosts={false}
                hasMoreFollowers={false}
                hasMoreFollowing={false}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}