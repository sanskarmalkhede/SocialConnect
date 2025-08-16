import { createMocks } from 'node-mocks-http'
import { GET, PATCH } from '@/app/api/notifications/route'

// Mock dependencies
jest.mock('@/lib/auth/auth-helpers', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/notifications/notification-service', () => ({
  getUserNotifications: jest.fn(),
  getUnreadNotificationCount: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getNotificationStats: jest.fn(),
}))

describe('/api/notifications', () => {
  const mockUser = { id: '1', email: 'test@example.com' }
  const mockProfile = { id: '1', username: 'testuser', role: 'user' }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockAuth = require('@/lib/auth/auth-helpers').authenticateRequest
    mockAuth.mockResolvedValue({ user: mockUser, profile: mockProfile })
  })

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const mockGetNotifications = require('@/lib/notifications/notification-service').getUserNotifications
      mockGetNotifications.mockResolvedValue({
        notifications: [
          {
            id: '1',
            message: 'Test notification',
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/notifications',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.notifications).toHaveLength(1)
      expect(mockGetNotifications).toHaveBeenCalledWith('1', 1, 20, false)
    })

    it('should return unread count when action=count', async () => {
      const mockGetCount = require('@/lib/notifications/notification-service').getUnreadNotificationCount
      mockGetCount.mockResolvedValue(5)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/notifications?action=count',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.unreadCount).toBe(5)
      expect(mockGetCount).toHaveBeenCalledWith('1')
    })

    it('should return notification stats when action=stats', async () => {
      const mockGetStats = require('@/lib/notifications/notification-service').getNotificationStats
      mockGetStats.mockResolvedValue({
        total: 10,
        unread: 3,
        read: 7,
        byType: { follow: 2, like: 5, comment: 3 },
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/notifications?action=stats',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(10)
      expect(data.data.unread).toBe(3)
      expect(mockGetStats).toHaveBeenCalledWith('1')
    })

    it('should filter unread notifications when unread_only=true', async () => {
      const mockGetNotifications = require('@/lib/notifications/notification-service').getUserNotifications

      const { req } = createMocks({
        method: 'GET',
        url: '/api/notifications?unread_only=true',
      })

      await GET(req as any)

      expect(mockGetNotifications).toHaveBeenCalledWith('1', 1, 20, true)
    })
  })

  describe('PATCH /api/notifications', () => {
    it('should mark all notifications as read', async () => {
      const mockMarkAllRead = require('@/lib/notifications/notification-service').markAllNotificationsAsRead
      mockMarkAllRead.mockResolvedValue(undefined)

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          action: 'mark_all_read',
        },
      })

      const response = await PATCH(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toContain('marked as read')
      expect(mockMarkAllRead).toHaveBeenCalledWith('1')
    })

    it('should return 400 for invalid action', async () => {
      const { req } = createMocks({
        method: 'PATCH',
        body: {
          action: 'invalid_action',
        },
      })

      const response = await PATCH(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })
})