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
  comment_count: 2
}

describe('PostCard', () => {
  it('renders post content and author information', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('This is a test post')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // like count
    expect(screen.getByText('2')).toBeInTheDocument() // comment count
  })

  it('calls onLike when like button is clicked', () => {
    const onLike = jest.fn()
    render(<PostCard post={mockPost} currentUserId="2" onLike={onLike} />)
    
    const likeButton = screen.getByRole('button', { name: /5/i })
    fireEvent.click(likeButton)
    
    expect(onLike).toHaveBeenCalledWith('1')
  })

  it('shows edit/delete options for own posts', () => {
    render(<PostCard post={mockPost} currentUserId="1" />)
    
    const menuButton = screen.getByRole('button', { name: /more/i })
    fireEvent.click(menuButton)
    
    expect(screen.getByText(/edit post/i)).toBeInTheDocument()
    expect(screen.getByText(/delete post/i)).toBeInTheDocument()
  })

  it('does not show edit/delete options for other users posts', () => {
    render(<PostCard post={mockPost} currentUserId="2" />)
    
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
  })
})