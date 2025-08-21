import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validations'
import { loginUser, getUserProfile } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { checkRateLimit } from '@/lib/auth/middleware'
import { ZodIssue } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }),
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Authenticate user
    const user = await loginUser({ email, password })

    // Get user profile
    const profile = await getUserProfile(user.id)

    return NextResponse.json(
      createAPIResponse({
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email.confirmed_at
        },
        profile
      }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
