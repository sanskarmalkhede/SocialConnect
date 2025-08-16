'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2, Edit } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatRelativeTime, formatCount, getInitials } from '@/lib/format'
import { POST_CATEGORY_LABELS } from '@/constants'
import type { Post } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: Post
  currentUserId?: string
  showActions?: boolean
  onLike?: (postId: string) => Promise<void>
  onUnlike?: (postId: string) => Promise<void>
  onComment?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onShare?: (postId: string) => void
  className?: string
}

export function PostCard({
  post,
  currentUserId,
  showActions = true,
  onLike,
  onUnlike,
  onComment,
  onEdit,
  onDelete,
  onShare,
  className
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count)
  const [localIsLiked, setLocalIsLiked] = useState(post.is_liked_by_user || false)

  const isOwnPost = currentUserId === post.author_id
  const isAdmin = currentUserId && post.author.role === 'admin' // This would need to be passed from parent

  const handleLikeClick = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)
    const wasLiked = localIsLiked

    try {
      // Optimistic update
      setLocalIsLiked(!wasLiked)
      setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

      if (wasLiked) {
        await onUnlike?.(post.id)
      } else {
        await onLike?.(post.id)
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(wasLiked)
      setLocalLikeCount(post.like_count)
      console.error('Like/unlike error:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'question':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.username} />
                <AvatarFallback>
                  {getInitials(post.author.username)}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/profile/${post.author.username}`}
                  className="font-semibold hover:underline truncate"
                >
                  {post.author.username}
                </Link>
                {post.author.role === 'admin' && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', getCategoryColor(post.category))}
                >
                  {POST_CATEGORY_LABELS[post.category]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatRelativeTime(post.created_at)}
                {post.updated_at !== post.created_at && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {/* Post Menu */}
          {(isOwnPost || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(post.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                )}
                {(isOwnPost || isAdmin) && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(post.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Post Content */}
        <div className="mb-4">
          <p className="text-sm whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Post Image */}
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden border">
            <Image
              src={post.image_url}
              alt="Post image"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              priority={false}
            />
          </div>
        )}

        {/* Post Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4">
              {/* Like Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeClick}
                disabled={!currentUserId || isLiking}
                className={cn(
                  'flex items-center gap-2 h-8 px-2',
                  localIsLiked && 'text-red-500 hover:text-red-600'
                )}
              >
                <Heart 
                  className={cn(
                    'h-4 w-4',
                    localIsLiked && 'fill-current'
                  )} 
                />
                <span className="text-sm">
                  {formatCount(localLikeCount)}
                </span>
              </Button>

              {/* Comment Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(post.id)}
                className="flex items-center gap-2 h-8 px-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">
                  {formatCount(post.comment_count)}
                </span>
              </Button>

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(post.id)}
                className="flex items-center gap-2 h-8 px-2"
              >
                <Share className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </Button>
            </div>

            {/* Post Link */}
            <Link href={`/posts/${post.id}`}>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View Post
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}