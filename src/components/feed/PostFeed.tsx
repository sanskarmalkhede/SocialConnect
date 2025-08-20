'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Filter, TrendingUp, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostCard } from '@/components/posts/PostCard'
import { PostForm } from '@/components/posts/PostForm'
import { Skeleton } from '@/components/ui/skeleton'
import type { Post, Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PostFeedProps {
  posts: Post[]
  currentUser?: Profile
  isLoading?: boolean
  hasMore?: boolean
  feedType?: 'personalized' | 'public' | 'trending'
  onLoadMore?: () => void
  onRefresh?: () => void
  onCreatePost?: () => Promise<void>
  onCreatePost?: () => Promise<void>
  onLikePost?: (postId: string) => Promise<void>
  onUnlikePost?: (postId: string) => Promise<void>
  onCommentPost?: (postId: string) => void
  onEditPost?: (postId: string) => void
  onDeletePost?: (postId: string) => void
  onSharePost?: (postId: string) => void
  className?: string
}

export function PostFeed({
  posts = [],
  currentUser,
  isLoading = false,
  hasMore = false,
  feedType = 'public',
  onLoadMore,
  onRefresh,
  onCreatePost,
  onLikePost,
  onUnlikePost,
  onCommentPost,
  onEditPost,
  onDeletePost,
  onSharePost,
  className
}: PostFeedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
      toast.success('Feed refreshed')
    } catch (error) {
      console.error('Refresh error:', error)
      toast.error('Failed to refresh feed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreatePost = async () => {
    try {
      // PostForm handles creation internally and calls onSuccess.
      // If a parent callback is provided (onCreatePost) call it as a notifier.
      await onCreatePost?.()
  setShowCreatePost(false)
  toast.success('Post created successfully')
    } catch (error) {
      console.error('Create post error:', error)
      toast.error('Failed to create post')
    }
  }

  const getFeedTitle = () => {
    switch (feedType) {
      case 'personalized':
        return 'Your Feed'
      case 'trending':
        return 'Trending'
      default:
        return 'Public Feed'
    }
  }

  const getFeedIcon = () => {
    switch (feedType) {
      case 'personalized':
        return <Users className="h-5 w-5" />
      case 'trending':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getFeedIcon()}
          <h2 className="text-xl font-semibold">{getFeedTitle()}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          
          {currentUser && onCreatePost && (
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              size="sm"
            >
              Create Post
            </Button>
          )}
        </div>
      </div>

      {/* Create Post Form */}
      {showCreatePost && currentUser && onCreatePost && (
        <PostForm
            profile={currentUser}
            onSuccess={handleCreatePost}
            onOpenChange={(open) => { if (!open) setShowCreatePost(false) }}
          />
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading && posts.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="flex gap-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
  ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                onLike={onLikePost}
                onUnlike={onUnlikePost}
                onComment={onCommentPost}
                onEdit={onEditPost}
                onDelete={onDeletePost}
                onShare={onSharePost}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  onClick={onLoadMore}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load More Posts
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyFeed feedType={feedType} currentUser={currentUser} />
        )}
      </div>
    </div>
  )
}

interface EmptyFeedProps {
  feedType: 'personalized' | 'public' | 'trending'
  currentUser?: Profile
}

function EmptyFeed({ feedType, currentUser }: EmptyFeedProps) {
  const getEmptyMessage = () => {
    switch (feedType) {
      case 'personalized':
        return {
          title: 'Your feed is empty',
          description: currentUser 
            ? 'Follow some users to see their posts in your personalized feed.'
            : 'Sign in to see your personalized feed.',
          action: 'Discover Users'
        }
      case 'trending':
        return {
          title: 'No trending posts',
          description: 'There are no trending posts at the moment. Check back later!',
          action: 'View Public Feed'
        }
      default:
        return {
          title: 'No posts yet',
          description: 'Be the first to share something with the community!',
          action: 'Create Post'
        }
    }
  }

  const message = getEmptyMessage()

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          {getFeedIcon(feedType)}
        </div>
        <h3 className="text-lg font-semibold mb-2">{message.title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {message.description}
        </p>
        <Button variant="outline">
          {message.action}
        </Button>
      </CardContent>
    </Card>
  )
}

function getFeedIcon(feedType: string) {
  switch (feedType) {
    case 'personalized':
      return <Users className="h-8 w-8 text-muted-foreground" />
    case 'trending':
      return <TrendingUp className="h-8 w-8 text-muted-foreground" />
    default:
      return <Globe className="h-8 w-8 text-muted-foreground" />
  }
}

interface InfinitePostFeedProps extends PostFeedProps {
  onScrollEnd?: () => void
}

export function InfinitePostFeed({
  onScrollEnd,
  ...props
}: InfinitePostFeedProps) {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        onScrollEnd?.()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onScrollEnd])

  return <PostFeed {...props} />
}

interface FeedWithTabsProps extends Omit<PostFeedProps, 'feedType'> {
  availableTabs?: Array<{
    value: 'personalized' | 'public' | 'trending'
    label: string
    icon?: React.ReactNode
  }>
  defaultTab?: 'personalized' | 'public' | 'trending'
  onTabChange?: (tab: 'personalized' | 'public' | 'trending') => void
}

export function FeedWithTabs({
  availableTabs = [
    { value: 'personalized', label: 'For You', icon: <Users className="h-4 w-4" /> },
    { value: 'public', label: 'Public', icon: <Globe className="h-4 w-4" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="h-4 w-4" /> }
  ],
  defaultTab = 'public',
  onTabChange,
  ...props
}: FeedWithTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (value: string) => {
    const tab = value as 'personalized' | 'public' | 'trending'
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {availableTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {availableTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          <PostFeed {...props} feedType={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  )
}