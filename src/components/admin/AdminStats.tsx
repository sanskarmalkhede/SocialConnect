'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, Heart, MessageSquare, UserPlus, TrendingUp, Activity, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCount, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface PlatformStats {
  users: {
    total: number
    active: number
    newToday: number
  }
  posts: {
    total: number
    active: number
    newToday: number
  }
  engagement: {
    totalLikes: number
    totalComments: number
    totalFollows: number
  }
  lastUpdated: string
}

interface AdminStatsProps {
  onRefresh?: () => Promise<void>
  className?: string
}

export function AdminStats({
  onRefresh,
  className
}: AdminStatsProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call the admin service
      // const platformStats = await getPlatformStats()
      
      // Mock data
      const mockStats: PlatformStats = {
        users: {
          total: 1250,
          active: 1180,
          newToday: 15
        },
        posts: {
          total: 3420,
          active: 3380,
          newToday: 42
        },
        engagement: {
          totalLikes: 15680,
          totalComments: 8920,
          totalFollows: 4560
        },
        lastUpdated: new Date().toISOString()
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Load stats error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh?.()
      await loadStats()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  const userActiveRate = (stats.users.active / stats.users.total) * 100
  const postActiveRate = (stats.posts.active / stats.posts.total) * 100

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(stats.users.total)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                +{stats.users.newToday} today
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(stats.users.active)}</div>
            <div className="space-y-2">
              <Progress value={userActiveRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {userActiveRate.toFixed(1)}% of total users
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(stats.posts.total)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                +{stats.posts.newToday} today
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(stats.posts.active)}</div>
            <div className="space-y-2">
              <Progress value={postActiveRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {postActiveRate.toFixed(1)}% of total posts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCount(stats.engagement.totalLikes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats.engagement.totalLikes / stats.posts.active).toFixed(1)} avg per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCount(stats.engagement.totalComments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats.engagement.totalComments / stats.posts.active).toFixed(1)} avg per post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Follows</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCount(stats.engagement.totalFollows)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats.engagement.totalFollows / stats.users.active).toFixed(1)} avg per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">User Engagement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Rate:</span>
                  <span className={cn(
                    'font-medium',
                    userActiveRate >= 90 ? 'text-green-600' : 
                    userActiveRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {userActiveRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Users Today:</span>
                  <span className="font-medium">{stats.users.newToday}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Content Health</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Posts:</span>
                  <span className={cn(
                    'font-medium',
                    postActiveRate >= 95 ? 'text-green-600' : 
                    postActiveRate >= 85 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {postActiveRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Posts Today:</span>
                  <span className="font-medium">{stats.posts.newToday}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-xs text-muted-foreground">
            Last updated: {formatRelativeTime(stats.lastUpdated)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}