import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/auth/login/route'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}))

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for missing credentials', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {},
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for invalid email format', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'password123',
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 401 for invalid credentials', async () => {
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error.message).toContain('Invalid')
  })

  it('should return 200 for valid credentials', async () => {
    const mockSignIn = require('@/lib/supabase/client').supabase.auth.signInWithPassword
    mockSignIn.mockResolvedValue({
      data: {
        user: { id: '1', email: 'test@example.com' },
        session: { access_token: 'token123' },
      },
      error: null,
    })

    const { req } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.user).toBeDefined()
  })
})