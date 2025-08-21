import { NextRequest, NextResponse } from 'next/server'
import { getProfileFollowing } from '@/lib/profile/profile-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
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
    const _auth = await optionalAuth(request)

    // Get following
    const result = await getProfileFollowing(id, page, limit)

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
