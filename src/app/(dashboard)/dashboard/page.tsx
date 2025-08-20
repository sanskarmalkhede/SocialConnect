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

export default function DashboardPage() {
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

  const response = await fetch(`/api/feed/initial?${params}`)

      // If unauthorized, fall back to public feed
      if (response.status === 401) {
  const publicParams = new URLSearchParams(params.toString())
  const publicResp = await fetch(`/api/feed/initial?${publicParams}`)
        const publicText = await publicResp.text()
        try {
          const publicData = JSON.parse(publicText)
          if (pageNum === 1) {
            setPosts(publicData.data.posts)
          } else {
            setPosts(prev => [...prev, ...publicData.data.posts])
          }
          setHasMore(publicData.data.hasMore)
          setPage(pageNum)
          return
        } catch (err) {
          throw new Error('Failed to load public feed fallback')
        }
      }

      // Try to parse JSON but guard against HTML responses
      let data
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch (err) {
        // Log server response for debugging
        console.error('Feed response text:', text)
        throw new Error('Invalid response from server')
      }

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Your session has expired. Please log in again.')
      }

      // Try with auth header if we have a session token
      const statsResp = await fetch('/api/feed/stats', session?.access_token ? {
        headers: { Authorization: `Bearer ${session.access_token}` }
      } : undefined)

      const statsText = await statsResp.text()
      let statsData
      try {
        statsData = JSON.parse(statsText)
      } catch (err) {
        // If server returned HTML (error page), log it and try unauthenticated
        console.error('Feed stats invalid JSON response:', statsText)
        // Retry without auth
        const retryResp = await fetch('/api/feed/stats')
        const retryText = await retryResp.text()
        try {
          statsData = JSON.parse(retryText)
        } catch (err2) {
          throw new Error('Invalid response from server')
        }
        if (!retryResp.ok) {
          throw new Error(statsData.error?.message || 'Failed to load feed stats')
        }
        setFeedStats(statsData.data)
        return
      }

      if (!statsResp.ok) {
        throw new Error(statsData.error?.message || 'Failed to load feed stats')
      }

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
    <div className="container space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feed</h1>
        <Button onClick={() => setShowCreatePost(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <FeedFilters
            filters={filters}
            onFiltersChange={setFilters}
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
        </div>
      </div>

      <PostForm
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onSuccess={() => {
          setShowCreatePost(false)
          loadFeed(1)
        }}
      />
    </div>
  )
}
