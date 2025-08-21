import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations'
import { registerUser, createUserProfile } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { checkRateLimit } from '@/lib/auth/middleware'
import { ZodIssue } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Too many registration attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = registerSchema.safeParse(body)
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

    const { email, password, username } = validationResult.data

    // Register user
    const result = await registerUser({
      email,
      password,
      confirmPassword: password,
      username
    })

    // Create user profile
    if (result.user) {
      try {
        await createUserProfile(result.user.id, username)
      } catch (profileError) {
        console.error('Failed to create user profile:', profileError)
        // Note: User is already created in auth, but profile creation failed
        // This should be handled by a background job or manual intervention
      }
    }

    return NextResponse.json(
      createAPIResponse({
        user: {
          id: result.user?.id,
          email: result.user?.email,
          email_confirmed_at: result.user?.email_confirmed_at
        },
        needsEmailVerification: result.needsEmailVerification
      }),
      { status: 201 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
