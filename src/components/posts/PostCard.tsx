'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/auth/auth-helpers'
import { likePost, unlikePost } from '@/lib/social/like-service'
import { deletePost } from '@/lib/posts/post-service'
import { useToast } from '@/hooks/use-toast'
import { type Post } from '@/types'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: Post
  onPostDeleted?: (postId: string) => void
}

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLiking, setIsLiking] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user)

  const handleLikeClick = async () => {
    if (!user || isLiking) return

    setIsLiking(true)
    const originalIsLiked = isLiked
    const originalLikeCount = likeCount

    // Optimistic update
    setIsLiked(!originalIsLiked)
    setLikeCount(originalLikeCount + (!originalIsLiked ? 1 : -1))

    try {
      if (originalIsLiked) {
        await unlikePost(post.id, user.id)
      } else {
        await likePost(post.id, user.id)
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
      toast({ title: 'Error', description: 'Failed to update like status.', variant: 'destructive' })
    }
    setIsLiking(false)
  }

  const handleDelete = async () => {
    if (!user || (user.id !== post.author_id && profile?.role !== 'admin')) return

    try {
      await deletePost(post.id)
      toast({ title: 'Success', description: 'Post deleted successfully.' })
      onPostDeleted?.(post.id)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.author.avatar_url || ''} />
          <AvatarFallback>{post.author.username.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">
              {post.author.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm">{post.content}</p>
        </div>
        {(user?.id === post.author_id || profile?.role === 'admin') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      {post.image_url && (
        <CardContent className="p-0">
          <Image src={post.image_url} alt="Post image" width={500} height={500} className="w-full h-auto object-cover" />
        </CardContent>
      )}
      <CardFooter className="p-2 flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleLikeClick} disabled={isLiking || !user}>
          <Heart className={cn('mr-2 h-4 w-4', isLiked && 'fill-red-500 text-red-500')} />
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="mr-2 h-4 w-4" />
          {post.comment_count}
        </Button>
        <Button variant="ghost" size="sm">
          <Bookmark className="mr-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}