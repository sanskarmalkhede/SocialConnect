'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share, Bookmark, Flag, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LikeButton } from './LikeButton'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SocialInteractionBarProps {
  postId: string
  likeCount: number
  commentCount: number
  isLiked?: boolean
  isBookmarked?: boolean
  currentUserId?: string
  onLike?: (postId: string) => Promise<void>
  onUnlike?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onBookmark?: (postId: string) => Promise<void>
  onUnbookmark?: (postId: string) => Promise<void>
  onReport?: (postId: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
}

export function SocialInteractionBar({
  postId,
  likeCount,
  commentCount,
  isLiked = false,
  isBookmarked = false,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onShare,
  onBookmark,
  onUnbookmark,
  onReport,
  className,
  size = 'md',
  variant = 'default'
}: SocialInteractionBarProps) {
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [localIsBookmarked, setLocalIsBookmarked] = useState(isBookmarked)

  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-9 px-4 text-sm'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const handleBookmarkClick = async () => {
    if (!currentUserId || isBookmarking) return

    setIsBookmarking(true)
    const wasBookmarked = localIsBookmarked

    try {
      // Optimistic update
      setLocalIsBookmarked(!wasBookmarked)

      if (wasBookmarked) {
        await onUnbookmark?.(postId)
        toast.success('Removed from bookmarks')
      } else {
        await onBookmark?.(postId)
        toast.success('Added to bookmarks')
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsBookmarked(wasBookmarked)
      console.error('Bookmark error:', error)
      toast.error('Failed to update bookmark status')
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleShareClick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          url: `${window.location.origin}/posts/${postId}`
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`)
        toast.success('Link copied to clipboard')
      }
      onShare?.(postId)
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to share post')
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {/* Like Button */}
        {onLike && onUnlike && (
          <LikeButton
            postId={postId}
            likeCount={likeCount}
            isLiked={isLiked}
            onLike={onLike}
            onUnlike={onUnlike}
            disabled={!currentUserId}
            size={size}
            showCount={true}
          />
        )}

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment?.(postId)}
          className={cn('flex items-center gap-2', sizeClasses[size])}
        >
          <MessageCircle className={iconSizes[size]} />
          <span>{formatCount(commentCount)}</span>
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn('p-2', sizeClasses[size])}>
              <MoreHorizontal className={iconSizes[size]} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShareClick}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {currentUserId && (
              <DropdownMenuItem onClick={handleBookmarkClick} disabled={isBookmarking}>
                <Bookmark className="mr-2 h-4 w-4" />
                {localIsBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </DropdownMenuItem>
            )}
            {currentUserId && (
              <DropdownMenuItem onClick={() => onReport?.(postId)}>
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-1">
        {/* Like Button */}
        {onLike && onUnlike && (
          <LikeButton
            postId={postId}
            likeCount={likeCount}
            isLiked={isLiked}
            onLike={onLike}
            onUnlike={onUnlike}
            disabled={!currentUserId}
            size={size}
            showCount={true}
          />
        )}

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment?.(postId)}
          className={cn('flex items-center gap-2', sizeClasses[size])}
        >
          <MessageCircle className={iconSizes[size]} />
          <span>{formatCount(commentCount)}</span>
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShareClick}
          className={cn('flex items-center gap-2', sizeClasses[size])}
        >
          <Share className={iconSizes[size]} />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {/* Bookmark Button */}
        {currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmarkClick}
            disabled={isBookmarking}
            className={cn(
              'flex items-center gap-2',
              sizeClasses[size],
              localIsBookmarked && 'text-blue-500 hover:text-blue-600'
            )}
          >
            <Bookmark 
              className={cn(
                iconSizes[size],
                localIsBookmarked && 'fill-current'
              )} 
            />
            <span className="hidden md:inline">
              {localIsBookmarked ? 'Saved' : 'Save'}
            </span>
          </Button>
        )}

        {/* Report Button */}
        {currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReport?.(postId)}
            className={cn(
              'flex items-center gap-2 text-muted-foreground hover:text-destructive',
              sizeClasses[size]
            )}
          >
            <Flag className={iconSizes[size]} />
            <span className="hidden lg:inline">Report</span>
          </Button>
        )}
      </div>
    </div>
  )
}

interface SocialStatsProps {
  likeCount: number
  commentCount: number
  shareCount?: number
  className?: string
}

export function SocialStats({
  likeCount,
  commentCount,
  shareCount,
  className
}: SocialStatsProps) {
  return (
    <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
      <span>{formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}</span>
      <span>{formatCount(commentCount)} {commentCount === 1 ? 'comment' : 'comments'}</span>
      {shareCount !== undefined && (
        <span>{formatCount(shareCount)} {shareCount === 1 ? 'share' : 'shares'}</span>
      )}
    </div>
  )
}

interface QuickActionsProps {
  postId: string
  onQuickLike?: (postId: string) => Promise<void>
  onQuickComment?: (postId: string) => void
  onQuickShare?: (postId: string) => void
  className?: string
}

export function QuickActions({
  postId,
  onQuickLike,
  onQuickComment,
  onQuickShare,
  className
}: QuickActionsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onQuickLike?.(postId)}
        className="h-8 w-8 p-0"
      >
        <Heart className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onQuickComment?.(postId)}
        className="h-8 w-8 p-0"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onQuickShare?.(postId)}
        className="h-8 w-8 p-0"
      >
        <Share className="h-4 w-4" />
      </Button>
    </div>
  )
}