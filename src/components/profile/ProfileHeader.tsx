
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-helpers'
import { followUser, unfollowUser } from '@/lib/social/follow-service'
import { type Profile } from '@/types'
import { useState } from 'react'

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(profile.is_following)
  const [followerCount, setFollowerCount] = useState(profile.follower_count)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFollow = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await followUser(user.id, profile.id)
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    } catch (error) {
      console.error('Failed to follow user', error)
    }
    setIsSubmitting(false)
  }

  const handleUnfollow = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await unfollowUser(user.id, profile.id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } catch (error) {
      console.error('Failed to unfollow user', error)
    }
    setIsSubmitting(false)
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <Avatar className="h-24 w-24 md:h-32 md:w-32">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback>{profile.username.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {isOwnProfile ? (
            <Button variant="outline">Edit Profile</Button>
          ) : isFollowing ? (
            <Button variant="outline" onClick={handleUnfollow} disabled={isSubmitting}>
              Unfollow
            </Button>
          ) : (
            <Button onClick={handleFollow} disabled={isSubmitting}>Follow</Button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span><b>{profile.post_count}</b> posts</span>
          <span><b>{followerCount}</b> followers</span>
          <span><b>{profile.following_count}</b> following</span>
        </div>
        <p className="text-sm">{profile.bio}</p>
      </div>
    </div>
  )
}
