'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'
import { getProfileByUsername } from '@/lib/profile/profile-service'
import { useAuth } from '@/lib/auth/auth-helpers'
import { checkFollowStatus, followUser, unfollowUser } from '@/lib/social/follow-service'
import { toast } from 'sonner'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const { profile: currentUser, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const p = await getProfileByUsername(username)
        setProfile(p)

        if (p && currentUser) {
          try {
            const follows = await checkFollowStatus(currentUser.id, p.id)
            setIsFollowing(follows)
          } catch (err) {
            setIsFollowing(false)
          }
        }
      } catch (err) {
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (username) load()
  }, [username, currentUser])

  const handleFollow = async () => {
    if (!currentUser || !profile) return
    setIsFollowing(true)
    try {
      await followUser(currentUser.id, profile.id)
      toast.success('Followed')
    } catch (err) {
      setIsFollowing(false)
      toast.error(err instanceof Error ? err.message : 'Failed to follow')
    }
  }

  const handleUnfollow = async () => {
    if (!currentUser || !profile) return
    setIsFollowing(false)
    try {
      await unfollowUser(currentUser.id, profile.id)
      toast.success('Unfollowed')
    } catch (err) {
      setIsFollowing(true)
      toast.error(err instanceof Error ? err.message : 'Failed to unfollow')
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async (_data: any) => {
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
          <p className="text-muted-foreground mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
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
                onLoadMorePosts={() => {}}
                onLoadMoreFollowers={() => {}}
                onLoadMoreFollowing={() => {}}
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