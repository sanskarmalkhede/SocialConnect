import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Profile, Post } from '@/lib/supabase/types'
import { useAuth } from '@/lib/auth/auth-helpers'
import { checkFollowStatus, followUser, unfollowUser, getFollowers, getFollowing } from '@/lib/social/follow-service'
import { getPosts } from '@/lib/posts/post-service'
import { toast } from 'sonner'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const { profile: currentUser, isLoading: _authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  // State for posts
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [postsPage, setPostsPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  // State for followers
  const [followers, setFollowers] = useState<Profile[]>([])
  const [followersPage, setFollowersPage] = useState(1)
  const [hasMoreFollowers, setHasMoreFollowers] = useState(true)
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)

  // State for following
  const [following, setFollowing] = useState<Profile[]>([])
  const [followingPage, setFollowingPage] = useState(1)
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/by-username/${username}`)
      if (!response.ok) {
        throw new Error('Profile not found')
      }
      const data = await response.json()
      const p = data.data as Profile
      setProfile(p)

      if (p && currentUser) {
        try {
          const follows = await checkFollowStatus(currentUser.id, p.id)
          setIsFollowing(follows)
        } catch (_) {
          setIsFollowing(false)
        }
      }
    } catch (_) {
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [username, currentUser])

  const fetchUserPosts = useCallback(async (pageNumber: number) => {
    if (!profile) return;
    setIsLoadingPosts(true);
    try {
      const { posts: newPosts, totalCount } = await getPosts({ page: pageNumber, limit: 10, authorId: profile.id });
      setUserPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setHasMorePosts(userPosts.length + newPosts.length < totalCount);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      setHasMorePosts(false); // Stop trying to load more on error
    } finally {
      setIsLoadingPosts(false);
    }
  }, [profile, userPosts.length]);

  const fetchFollowers = useCallback(async (pageNumber: number) => {
    if (!profile) return;
    setIsLoadingFollowers(true);
    try {
      const { profiles: newFollowers, totalCount } = await getFollowers(profile.id, pageNumber, 10);
      setFollowers((prevFollowers) => [...prevFollowers, ...newFollowers]);
      setHasMoreFollowers(followers.length + newFollowers.length < totalCount);
    } catch (error) {
      console.error("Failed to fetch followers:", error);
      setHasMoreFollowers(false);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [profile, followers.length]);

  const fetchFollowing = useCallback(async (pageNumber: number) => {
    if (!profile) return;
    setIsLoadingFollowing(true);
    try {
      const { profiles: newFollowing, totalCount } = await getFollowing(profile.id, pageNumber, 10);
      setFollowing((prevFollowing) => [...prevFollowing, ...newFollowing]);
      setHasMoreFollowing(following.length + newFollowing.length < totalCount);
    } catch (error) {
      console.error("Failed to fetch following:", error);
      setHasMoreFollowing(false);
    } finally {
      setIsLoadingFollowing(false);
    }
  }, [profile, following.length]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserPosts(1);
      fetchFollowers(1);
      fetchFollowing(1);
    }
  }, [profile, fetchUserPosts, fetchFollowers, fetchFollowing]);

  const handleLoadMorePosts = useCallback(() => {
    if (hasMorePosts && !isLoadingPosts) {
      setPostsPage((prevPage) => prevPage + 1);
    }
  }, [hasMorePosts, isLoadingPosts]);

  const handleLoadMoreFollowers = useCallback(() => {
    if (hasMoreFollowers && !isLoadingFollowers) {
      setFollowersPage((prevPage) => prevPage + 1);
    }
  }, [hasMoreFollowers, isLoadingFollowers]);

  const handleLoadMoreFollowing = useCallback(() => {
    if (hasMoreFollowing && !isLoadingFollowing) {
      setFollowingPage((prevPage) => prevPage + 1);
    }
  }, [hasMoreFollowing, isLoadingFollowing]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return
    setIsFollowing(true)
    try {
      await followUser(currentUser.id, profile.id)
      toast.success('Followed')
      // Optionally refresh follower count on profile
    } catch (_) {
      setIsFollowing(false)
      toast.error(_ instanceof Error ? _.message : 'Failed to follow')
    }
  }

  const handleUnfollow = async () => {
    if (!currentUser || !profile) return
    setIsFollowing(false)
    try {
      await unfollowUser(currentUser.id, profile.id)
      toast.success('Unfollowed')
      // Optionally refresh follower count on profile
    } catch (_) {
      setIsFollowing(true)
      toast.error(_ instanceof Error ? _.message : 'Failed to unfollow')
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async (data: ProfileFormData & { avatar?: File }) => {
    if (!currentUser || !profile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('bio', data.bio || '');
    formData.append('website', data.website || '');
    formData.append('location', data.location || '');
    formData.append('profile_visibility', data.profile_visibility);
    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    try {
      const response = await fetch(`/api/users/me`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      setProfile(result.data as Profile); // Update local state with new profile data
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="ml-4">
            <h1 className="font-semibold">{profile.username}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-6">
          {isEditing ? (
            <ProfileForm
              profile={profile}
              onSubmit={handleSaveProfile}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          ) : (
            <>
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEditProfile={handleEditProfile}
                isLoading={isLoading}
              />

              <ProfileTabs
                profile={profile}
                isOwnProfile={isOwnProfile}
                posts={userPosts}
                followers={followers}
                following={following}
                isLoading={isLoadingPosts || isLoadingFollowers || isLoadingFollowing}
                onLoadMorePosts={handleLoadMorePosts}
                onLoadMoreFollowers={handleLoadMoreFollowers}
                onLoadMoreFollowing={handleLoadMoreFollowing}
                hasMorePosts={hasMorePosts}
                hasMoreFollowers={hasMoreFollowers}
                hasMoreFollowing={hasMoreFollowing}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}