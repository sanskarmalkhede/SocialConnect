import { NextRequest, NextResponse } from 'next/server'
import { getProfileFollowers } from '@/lib/profile/profile-service'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { optionalAuth } from '@/lib/auth/middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 results per page

    // Optional authentication (for future visibility checks)
    const auth = await optionalAuth(request)

    // Get followers
    const result = await getProfileFollowers(id, page, limit)

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get profile followers API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}