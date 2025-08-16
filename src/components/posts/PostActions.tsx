'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share, Bookmark, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PostActionsProps {
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
}

export function PostActions({
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
  size = 'md'
}: PostActionsProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(likeCount)
  const [localIsLiked, setLocalIsLiked] = useState(isLiked)
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

  const handleLikeClick = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)
    const wasLiked = localIsLiked

    try {
      // Optimistic update
      setLocalIsLiked(!wasLiked)
      setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

      if (wasLiked) {
        await onUnlike?.(postId)
      } else {
        await onLike?.(postId)
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(wasLiked)
      setLocalLikeCount(likeCount)
      console.error('Like/unlike error:', error)
      toast.error('Failed to update like status')
    } finally {
      setIsLiking(false)
    }
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

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLikeClick}
        disabled={!currentUserId || isLiking}
        className={cn(
          'flex items-center gap-2',
          sizeClasses[size],
          localIsLiked && 'text-red-500 hover:text-red-600'
        )}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            localIsLiked && 'fill-current'
          )} 
        />
        <span>{formatCount(localLikeCount)}</span>
      </Button>

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
  )
}

interface CompactPostActionsProps {
  postId: string
  likeCount: number
  commentCount: number
  isLiked?: boolean
  currentUserId?: string
  onLike?: (postId: string) => Promise<void>
  onUnlike?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  className?: string
}

export function CompactPostActions({
  postId,
  likeCount,
  commentCount,
  isLiked = false,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  className
}: CompactPostActionsProps) {
  return (
    <PostActions
      postId={postId}
      likeCount={likeCount}
      commentCount={commentCount}
      isLiked={isLiked}
      currentUserId={currentUserId}
      onLike={onLike}
      onUnlike={onUnlike}
      onComment={onComment}
      size="sm"
      className={className}
    />
  )
}