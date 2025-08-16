'use client'

import { useState } from 'react'
import { MapPin, Link as LinkIcon, Calendar, Settings, UserPlus, UserMinus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCount, getInitials, formatRelativeTime } from '@/lib/format'
import { PROFILE_VISIBILITY_LABELS } from '@/constants'
import type { Profile } from '@/lib/supabase/types'

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onEditProfile?: () => void
  isLoading?: boolean
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onEditProfile,
  isLoading = false
}: ProfileHeaderProps) {
  const [followLoading, setFollowLoading] = useState(false)

  const handleFollowClick = async () => {
    if (followLoading) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await onUnfollow?.()
      } else {
        await onFollow?.()
      }
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
            <AvatarFallback className="text-lg sm:text-xl">
              {getInitials(profile.username)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              {/* Username and Role */}
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold truncate">{profile.username}</h1>
                {profile.role === 'admin' && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {PROFILE_VISIBILITY_LABELS[profile.profile_visibility]}
                </Badge>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-muted-foreground mb-3 whitespace-pre-wrap break-words">
                  {profile.bio}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[200px]"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatRelativeTime(profile.created_at)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{formatCount(profile.post_count || 0)}</span>
                  <span className="text-muted-foreground">Posts</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{formatCount(profile.following_count || 0)}</span>
                  <span className="text-muted-foreground">Following</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{formatCount(profile.follower_count || 0)}</span>
                  <span className="text-muted-foreground">Followers</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  onClick={onEditProfile}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowClick}
                  disabled={followLoading || isLoading}
                  className="flex items-center gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}