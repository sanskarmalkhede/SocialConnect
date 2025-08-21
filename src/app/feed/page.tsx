'use client'

import { useState, useEffect, useCallback } from 'react';
import PostFeed from '@/components/feed/PostFeed';
import FeedFilters from '@/components/feed/FeedFilters';
import { getPosts } from '@/lib/posts/post-service';
import { Post } from '@/types';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNumber: number) => {
    setIsLoading(true);
    try {
      const { posts: newPosts, totalCount } = await getPosts({ page: pageNumber, limit: 10 });
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setHasMore(posts.length + newPosts.length < totalCount);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setIsLoading(false);
    }
  }, [posts.length]);

  useEffect(() => {
    fetchPosts(1); // Initial fetch
  }, [fetchPosts]);

  const onLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page, fetchPosts]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Feed</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FeedFilters />
        </div>
        <div className="md:col-span-3">
          <PostFeed posts={posts} isLoading={isLoading} hasMore={hasMore} onLoadMore={onLoadMore} />
        </div>
      </div>
    </div>
  );
}
