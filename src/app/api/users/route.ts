import { NextRequest, NextResponse } from 'next/server'
import { searchProfiles } from '@/lib/profile/profile-service'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { optionalAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 results per page

    // Optional authentication (for future features like showing follow status)
    const auth = await optionalAuth(request)

    if (!query.trim()) {
      return NextResponse.json(
        createAPIResponse({
          profiles: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        }),
        { status: 200 }
      )
    }

    // Search profiles
    const result = await searchProfiles(query.trim(), page, limit)

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    console.error('Search users API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}