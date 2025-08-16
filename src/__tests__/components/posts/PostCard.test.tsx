import { render, screen, fireEvent } from '@testing-library/react'
import { PostCard } from '@/components/posts/PostCard'
import type { Post } from '@/lib/supabase/types'

const mockPost: Post = {
  id: '1',
  content: 'This is a test post',
  image_url: null,
  author_id: '1',
  author: {
    id: '1',
    username: 'testuser',
    avatar_url: null,
    role: 'user',
    profile_visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  category: 'general',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_active: true,
  like_count: 5,
  comment_count: 3,
  is_liked_by_user: false
}

describe('PostCard Component', () => {
  const mockProps = {
    post: mockPost,
    currentUserId: '2',
    onLike: jest.fn(),
    onUnlike: jest.fn(),
    onComment: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onShare: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders post content and author information', () => {
    render(<PostCard {...mockProps} />)
    
    expect(screen.getByText('This is a test post')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // like count
    expect(screen.getByText('3')).toBeInTheDocument() // comment count
  })

  it('shows like button as not liked initially', () => {
    render(<PostCard {...mockProps} />)
    
    const likeButton = screen.getByRole('button', { name: /like/i })
    expect(likeButton).toBeInTheDocument()
    expect(likeButton).not.toHaveClass('text-red-500') // not liked state
  })

  it('shows like button as liked when is_liked_by_user is true', () => {
    const likedPost = { ...mockPost, is_liked_by_user: true }
    render(<PostCard {...mockProps} post={likedPost} />)
    
    const likeButton = screen.getByRole('button', { name: /unlike/i })
    expect(likeButton).toBeInTheDocument()
  })

  it('calls onLike when like button is clicked', () => {
    render(<PostCard {...mockProps} />)
    
    const likeButton = screen.getByRole('button', { name: /like/i })
    fireEvent.click(likeButton)
    
    expect(mockProps.onLike).toHaveBeenCalledWith('1')
  })

  it('calls onUnlike when unlike button is clicked', () => {
    const likedPost = { ...mockPost, is_liked_by_user: true }
    render(<PostCard {...mockProps} post={likedPost} />)
    
    const unlikeButton = screen.getByRole('button', { name: /unlike/i })
    fireEvent.click(unlikeButton)
    
    expect(mockProps.onUnlike).toHaveBeenCalledWith('1')
  })

  it('calls onComment when comment button is clicked', () => {
    render(<PostCard {...mockProps} />)
    
    const commentButton = screen.getByRole('button', { name: /comment/i })
    fireEvent.click(commentButton)
    
    expect(mockProps.onComment).toHaveBeenCalledWith('1')
  })

  it('shows edit and delete options for post author', () => {
    const ownPost = { ...mockPost, author_id: '2' }
    render(<PostCard {...mockProps} post={ownPost} />)
    
    // Should show more options menu for own post
    const moreButton = screen.getByRole('button', { name: /more options/i })
    expect(moreButton).toBeInTheDocument()
  })

  it('displays relative time correctly', () => {
    render(<PostCard {...mockProps} />)
    
    // Should show some time indication
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('displays category badge', () => {
    render(<PostCard {...mockProps} />)
    
    expect(screen.getByText('General')).toBeInTheDocument()
  })
})