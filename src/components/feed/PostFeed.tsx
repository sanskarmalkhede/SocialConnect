
'use client'

import { PostCard } from '@/components/posts/PostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { type Post } from '@/types'
import { useEffect, useRef, useCallback } from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

interface PostFeedProps {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function PostFeed({ posts, isLoading, hasMore, onLoadMore }: PostFeedProps) {
  const observer = useRef<IntersectionObserver>()
  const lastPostElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore()
        }
      })
      if (node) observer.current.observe(node)
    },
    [isLoading, hasMore, onLoadMore]
  )

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No posts yet. Follow some people to see their posts here!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => {
        if (posts.length === index + 1) {
          return <div ref={lastPostElementRef} key={post.id}><PostCard post={post} /></div>
        } else {
          return <PostCard key={post.id} post={post} />
        }
      })}
      {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
    </div>
  )
}
