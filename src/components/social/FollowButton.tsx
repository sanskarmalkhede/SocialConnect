'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollow: (userId: string) => Promise<void>
  onUnfollow: (userId: string) => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showIcon?: boolean
  className?: string
}

export function FollowButton({
  userId,
  isFollowing,
  onFollow,
  onUnfollow,
  disabled = false,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await onUnfollow(userId)
        toast.success('Unfollowed successfully')
      } else {
        await onFollow(userId)
        toast.success('Following successfully')
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update follow status')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonVariant = isFollowing ? 'outline' : variant

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      size={size}
      variant={buttonVariant}
      className={cn('flex items-center gap-2', className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        isFollowing ? (
          <UserMinus className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )
      ) : null}
      <span>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </span>
    </Button>
  )
}

interface CompactFollowButtonProps extends Omit<FollowButtonProps, 'showIcon' | 'size'> {
  showText?: boolean
}

export function CompactFollowButton({
  showText = false,
  ...props
}: CompactFollowButtonProps) {
  return (
    <FollowButton
      {...props}
      size="sm"
      showIcon={!showText}
      className={cn('h-8 px-3', props.className)}
    >
      {showText && (
        <span className="hidden sm:inline">
          {props.isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
    </FollowButton>
  )
}

interface FollowButtonWithCountProps extends FollowButtonProps {
  followerCount: number
  showCount?: boolean
}

export function FollowButtonWithCount({
  followerCount,
  showCount = true,
  ...props
}: FollowButtonWithCountProps) {
  return (
    <div className="flex items-center gap-2">
      <FollowButton {...props} />
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  )
}