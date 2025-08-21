
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-helpers'
import { getProfileByUsername } from '@/lib/profile/profile-service'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { PostFeed } from '@/components/feed/PostFeed'
import { Skeleton } from '@/components/ui/skeleton'
import { type Profile, type Post } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const fetchedProfile = await getProfileByUsername(username, user?.id)
        setProfile(fetchedProfile)
        setPosts(fetchedProfile.posts || [])
      } catch (error) {
        console.error('Failed to fetch profile', error)
      }
      setIsLoading(false)
    }

    if (username) {
      fetchProfile()
    }
  }, [username, user?.id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-10">User not found.</div>
  }

  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} />
      <PostFeed posts={posts} isLoading={false} hasMore={false} onLoadMore={() => {}} />
    </div>
  )
}
