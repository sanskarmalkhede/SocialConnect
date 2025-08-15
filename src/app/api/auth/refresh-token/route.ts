import { NextRequest, NextResponse } from 'next/server'
import { refreshSession } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await refreshSession()

    if (!session) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Failed to refresh session',
          code: 'REFRESH_FAILED'
        }),
        { status: 401 }
      )
    }

    return NextResponse.json(
      createAPIResponse({
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user.id,
            email: session.user.email
          }
        }
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Refresh token API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}