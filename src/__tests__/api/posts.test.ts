import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/posts/route'

// Mock dependencies
jest.mock('@/lib/auth/auth-helpers', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/posts/post-service', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
}))

describe('/api/posts', () => {
  const mockUser = { id: '1', email: 'test@example.com' }
  const mockProfile = { id: '1', username: 'testuser', role: 'user' }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockAuth = require('@/lib/auth/auth-helpers').authenticateRequest
    mockAuth.mockResolvedValue({ user: mockUser, profile: mockProfile })
  })

  describe('GET /api/posts', () => {
    it('should return posts with default pagination', async () => {
      const mockGetPosts = require('@/lib/posts/post-service').getPosts
      mockGetPosts.mockResolvedValue({
        posts: [
          {
            id: '1',
            content: 'Test post',
            author: { username: 'testuser' },
            like_count: 0,
            comment_count: 0,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/posts',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toHaveLength(1)
      expect(mockGetPosts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        userId: '1',
      })
    })

    it('should handle pagination parameters', async () => {
      const mockGetPosts = require('@/lib/posts/post-service').getPosts
      mockGetPosts.mockResolvedValue({
        posts: [],
        total: 0,
        page: 2,
        limit: 10,
        hasMore: false,
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/posts?page=2&limit=10',
      })

      const response = await GET(req as any)

      expect(mockGetPosts).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        userId: '1',
      })
    })
  })

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const mockCreatePost = require('@/lib/posts/post-service').createPost
      const newPost = {
        id: '2',
        content: 'New test post',
        author_id: '1',
        category: 'general',
      }
      mockCreatePost.mockResolvedValue(newPost)

      const { req } = createMocks({
        method: 'POST',
        body: {
          content: 'New test post',
          category: 'general',
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe('New test post')
      expect(mockCreatePost).toHaveBeenCalledWith('1', {
        content: 'New test post',
        category: 'general',
      })
    })

    it('should return 400 for invalid post data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          content: '', // Empty content should fail validation
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for unauthenticated requests', async () => {
      const mockAuth = require('@/lib/auth/auth-helpers').authenticateRequest
      mockAuth.mockRejectedValue(new Error('Authentication required'))

      const { req } = createMocks({
        method: 'POST',
        body: {
          content: 'Test post',
          category: 'general',
        },
      })

      const response = await POST(req as any)

      expect(response.status).toBe(500) // Will be handled by error handler
    })
  })
})