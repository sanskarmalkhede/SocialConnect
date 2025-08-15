import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordSchema } from '@/lib/validations'
import { sendPasswordResetEmail } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { checkRateLimit } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    if (!checkRateLimit(`password-reset:${clientIP}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Too many password reset attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid email address',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Send password reset email
    await sendPasswordResetEmail(email)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Password reset email sent successfully' 
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}