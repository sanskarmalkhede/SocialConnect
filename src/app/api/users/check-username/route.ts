import { NextRequest, NextResponse } from 'next/server'
import { validateUsernameAvailability } from '@/lib/profile/profile-validation'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { optionalAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Username parameter is required',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    // Get current user ID if authenticated (to exclude from availability check)
    const auth = await optionalAuth(request)
    const excludeUserId = auth?.user.id

    // Check username availability
    const validation = await validateUsernameAvailability(username, excludeUserId)

    return NextResponse.json(
      createAPIResponse({
        username,
        available: validation.isAvailable,
        message: validation.error || (validation.isAvailable ? 'Username is available' : 'Username is not available')
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Check username API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}