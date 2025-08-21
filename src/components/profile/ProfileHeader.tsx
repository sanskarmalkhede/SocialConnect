
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-helpers'
import { followUser, unfollowUser } from '@/lib/social/follow-service'
import { type Profile } from '@/types'
import { useState } from 'react'

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing: boolean
  onFollow: () => void
  onUnfollow: () => void
  onEditProfile: () => void
  isLoading: boolean
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
  onEditProfile,
  isLoading,
}: ProfileHeaderProps) {
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
            <Button variant="outline" onClick={onEditProfile} disabled={isLoading}>Edit Profile</Button>
          ) : isFollowing ? (
            <Button variant="outline" onClick={onUnfollow} disabled={isLoading}>Unfollow</Button>
          ) : (
            <Button onClick={onFollow} disabled={isLoading}>Follow</Button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span><b>{profile.post_count}</b> posts</span>
          <span><b>{profile.follower_count}</b> followers</span>
          <span><b>{profile.following_count}</b> following</span>
        </div>
        <p className="text-sm">{profile.bio}</p>
      </div>
    </div>
  )
}
