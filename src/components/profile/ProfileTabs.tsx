'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, getInitials } from '@/lib/format'
import type { Profile } from '@/lib/supabase/types'

interface ProfileTabsProps {
  profile: Profile
  isOwnProfile: boolean
  posts?: any[] // Will be properly typed when we implement posts
  followers?: Profile[]
  following?: Profile[]
  isLoading?: boolean
  onLoadMorePosts?: () => void
  onLoadMoreFollowers?: () => void
  onLoadMoreFollowing?: () => void
  hasMorePosts?: boolean
  hasMoreFollowers?: boolean
  hasMoreFollowing?: boolean
}

export function ProfileTabs({
  profile,
  isOwnProfile,
  posts = [],
  followers = [],
  following = [],
  isLoading = false,
  onLoadMorePosts,
  onLoadMoreFollowers,
  onLoadMoreFollowing,
  hasMorePosts = false,
  hasMoreFollowers = false,
  hasMoreFollowing = false
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('posts')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="posts">
          Posts ({profile.post_count || 0})
        </TabsTrigger>
        <TabsTrigger value="followers">
          Followers ({profile.follower_count || 0})
        </TabsTrigger>
        <TabsTrigger value="following">
          Following ({profile.following_count || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    {/* Post content will be implemented when we create PostCard component */}
                    <div className="text-center text-muted-foreground py-8">
                      Post component will be implemented in the next task
                    </div>
                  </CardContent>
                </Card>
              ))}
              {hasMorePosts && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={onLoadMorePosts}
                    disabled={isLoading}
                  >
                    Load More Posts
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="followers" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : followers.length > 0 ? (
            <>
              {followers.map((follower) => (
                <Card key={follower.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.avatar_url || undefined} alt={follower.username} />
                        <AvatarFallback>
                          {getInitials(follower.username)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{follower.username}</h3>
                          {follower.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        {follower.bio && (
                          <p className="text-sm text-muted-foreground truncate">
                            {follower.bio}
                          </p>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {hasMoreFollowers && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={onLoadMoreFollowers}
                    disabled={isLoading}
                  >
                    Load More Followers
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You don't have any followers yet." : "No followers yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="following" className="mt-6">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : following.length > 0 ? (
            <>
              {following.map((followedUser) => (
                <Card key={followedUser.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={followedUser.avatar_url || undefined} alt={followedUser.username} />
                        <AvatarFallback>
                          {getInitials(followedUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{followedUser.username}</h3>
                          {followedUser.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        {followedUser.bio && (
                          <p className="text-sm text-muted-foreground truncate">
                            {followedUser.bio}
                          </p>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {hasMoreFollowing && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={onLoadMoreFollowing}
                    disabled={isLoading}
                  >
                    Load More Following
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You're not following anyone yet." : "Not following anyone yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}