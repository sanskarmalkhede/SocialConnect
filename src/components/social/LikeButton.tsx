'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LikeButtonProps {
  postId: string
  likeCount: number
  isLiked: boolean
  onLike: (postId: string) => Promise<void>
  onUnlike: (postId: string) => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost'
  showCount?: boolean
  className?: string
}

export function LikeButton({
  postId,
  likeCount,
  isLiked,
  onLike,
  onUnlike,
  disabled = false,
  size = 'md',
  variant = 'ghost',
  showCount = true,
  className
}: LikeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(likeCount)
  const [localIsLiked, setLocalIsLiked] = useState(isLiked)

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

  const handleClick = async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    const wasLiked = localIsLiked

    try {
      // Optimistic update
      setLocalIsLiked(!wasLiked)
      setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

      if (wasLiked) {
        await onUnlike(postId)
      } else {
        await onLike(postId)
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(wasLiked)
      setLocalLikeCount(likeCount)
      console.error('Like/unlike error:', error)
      toast.error('Failed to update like status')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      variant={variant}
      size="sm"
      className={cn(
        'flex items-center gap-2',
        sizeClasses[size],
        localIsLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : (
        <Heart 
          className={cn(
            iconSizes[size],
            localIsLiked && 'fill-current'
          )} 
        />
      )}
      {showCount && (
        <span>{formatCount(localLikeCount)}</span>
      )}
    </Button>
  )
}

interface AnimatedLikeButtonProps extends LikeButtonProps {
  animationDuration?: number
}

export function AnimatedLikeButton({
  animationDuration = 300,
  ...props
}: AnimatedLikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = async (postId: string) => {
    setIsAnimating(true)
    await props.onLike(postId)
    setTimeout(() => setIsAnimating(false), animationDuration)
  }

  return (
    <LikeButton
      {...props}
      onLike={handleLike}
      className={cn(
        'transition-transform',
        isAnimating && 'scale-110',
        props.className
      )}
    />
  )
}

interface LikeButtonWithTooltipProps extends LikeButtonProps {
  showTooltip?: boolean
}

export function LikeButtonWithTooltip({
  showTooltip = true,
  ...props
}: LikeButtonWithTooltipProps) {
  return (
    <div className="relative group">
      <LikeButton {...props} />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {props.isLiked ? 'Unlike' : 'Like'}
        </div>
      )}
    </div>
  )
}