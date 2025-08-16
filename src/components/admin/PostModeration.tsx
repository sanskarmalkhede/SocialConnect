'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MoreHorizontal, Trash2, RotateCcw, Eye, Flag } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, formatCount, getInitials } from '@/lib/format'
import { POST_CATEGORY_LABELS } from '@/constants'
import type { Post } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PostModerationProps {
  onDeletePost?: (postId: string) => Promise<void>
  onRestorePost?: (postId: string) => Promise<void>
  onViewPost?: (postId: string) => void
  className?: string
}

export function PostModeration({
  onDeletePost,
  onRestorePost,
  onViewPost,
  className
}: PostModerationProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'general' | 'announcement' | 'question'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'like_count' | 'comment_count'>('created_at')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    loadPosts()
  }, [searchQuery, categoryFilter, statusFilter, sortBy, page])

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call the admin service
      // const result = await getPostsForModeration({ page, search: searchQuery, category: categoryFilter === 'all' ? undefined : categoryFilter, isActive: statusFilter === 'all' ? undefined : statusFilter === 'active', sortBy })
      
      // Mock data
      const mockPosts: Post[] = [
        {
          id: '1',
          content: 'This is a sample post that might need moderation. It contains some content that could be reviewed.',
          image_url: null,
          author_id: '1',
          author: {
            id: '1',
            username: 'john_doe',
            avatar_url: null,
            role: 'user',
            profile_visibility: 'public',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          category: 'general',
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          is_active: true,
          like_count: 15,
          comment_count: 8
        },
        {
          id: '2',
          content: 'Another post for moderation review. This one has been reported by users.',
          image_url: null,
          author_id: '2',
          author: {
            id: '2',
            username: 'user_two',
            avatar_url: null,
            role: 'user',
            profile_visibility: 'public',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:00:00Z'
          },
          category: 'question',
          created_at: '2024-01-19T10:15:00Z',
          updated_at: '2024-01-19T10:15:00Z',
          is_active: false,
          like_count: 3,
          comment_count: 12
        }
      ]

      setPosts(mockPosts)
      setHasMore(false)
    } catch (error) {
      console.error('Load posts error:', error)
      toast.error('Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await onDeletePost?.(postId)
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, is_active: false } : post
      ))
      toast.success('Post deleted')
    } catch (error) {
      console.error('Delete post error:', error)
      toast.error('Failed to delete post')
    }
  }

  const handleRestorePost = async (postId: string) => {
    try {
      await onRestorePost?.(postId)
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, is_active: true } : post
      ))
      toast.success('Post restored')
    } catch (error) {
      console.error('Restore post error:', error)
      toast.error('Failed to restore post')
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

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Post Moderation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">{POST_CATEGORY_LABELS.general}</SelectItem>
              <SelectItem value="announcement">{POST_CATEGORY_LABELS.announcement}</SelectItem>
              <SelectItem value="question">{POST_CATEGORY_LABELS.question}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="like_count">Likes</SelectItem>
              <SelectItem value="comment_count">Comments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className={cn(!post.is_active && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Author Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.username} />
                      <AvatarFallback>
                        {getInitials(post.author.username)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{post.author.username}</span>
                        <Badge className={getCategoryColor(post.category)}>
                          {POST_CATEGORY_LABELS[post.category]}
                        </Badge>
                        <Badge className={getStatusColor(post.is_active)}>
                          {post.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-sm mb-3 line-clamp-3">
                        {post.content}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatCount(post.like_count)} likes</span>
                        <span>{formatCount(post.comment_count)} comments</span>
                        <span>ID: {post.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPost?.(post.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Post
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {post.is_active ? (
                          <DropdownMenuItem 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestorePost(post.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore Post
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}