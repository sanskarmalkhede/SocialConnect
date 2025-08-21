'use client'

import { useState, useEffect, useCallback } from 'react'
import { PostFeed } from '@/components/feed/PostFeed'
import { FeedStats } from '@/components/feed/FeedStats'
import { FeedFilters, type FeedFilters as FeedFiltersType } from '@/components/feed/FeedFilters'
import { PostForm } from '@/components/posts/PostForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-helpers'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { type Post } from '@/lib/supabase/types'
import { type FeedStatsData } from '@/types/feed'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function FeedPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FeedFiltersType>({})
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [feedStats, setFeedStats] = useState<FeedStatsData | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async (pageNum: number = 1) => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
  const params = new URLSearchParams()
  params.append('page', pageNum.toString())
  params.append('limit', '20')
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v !== null && v !== undefined) params.append(key, v.toString())
            })
          } else {
            params.append(key, value.toString())
          }
        }
      })

  const response = await fetch(`/api/feed?${params}`)

      if (!response.ok) {
        throw new Error('Failed to load feed')
      }

      const data = await response.json()

      if (pageNum === 1) {
        setPosts(data.data.posts)
      } else {
        setPosts(prev => [...prev, ...data.data.posts])
      }
      
      setHasMore(data.data.hasMore)
      setPage(pageNum)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load feed. Please try again.'
      console.error('Load feed error:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, filters, toast])

  const loadFeedStats = useCallback(async () => {
    try {
      const statsResp = await fetch('/api/feed/stats')

      if (!statsResp.ok) {
        throw new Error('Failed to load feed stats')
      }

      const statsData = await statsResp.json()
      setFeedStats(statsData.data)
    } catch (error) {
      console.error('Load feed stats error:', error instanceof Error ? error.message : String(error))
      toast({
        title: "Error",
        description: "Failed to load feed statistics",
        variant: "destructive"
      })
    }
  }, [toast])

  // Initial load
  useEffect(() => {
    if (user) {
      loadFeed(1)
      loadFeedStats()
    }
  }, [user, loadFeed, loadFeedStats])

  // Reload when filters change
  useEffect(() => {
    if (user) {
      loadFeed(1)
    }
  }, [filters, loadFeed, user])

  if (!user) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Button onClick={() => setShowCreatePost(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
        <PostForm
          open={showCreatePost}
          onOpenChange={setShowCreatePost}
          onSuccess={() => {
            setShowCreatePost(false)
            loadFeed(1)
          }}
        />
        <PostFeed
          posts={posts}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={() => loadFeed(page + 1)}
        />
      </div>

      <div className="space-y-4">
        <FeedStats stats={feedStats} />
        <FeedFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  )
}
