import { NextRequest, NextResponse } from 'next/server'
import { 
  getPersonalizedFeed, 
  getPublicFeed
} from '@/lib/feed/feed-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { optionalAuthMiddleware } from '@/lib/auth/server-auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get('type') as 'personalized' | 'public' | 'trending' | 'category' || 'public'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const category = null
    const timeframe = null
    const sortBy = null

    // Optional authentication for personalized features
    const session = await optionalAuthMiddleware(request)
    const userId = session?.user?.id

    let result

    switch (feedType) {
      case 'personalized':
        if (!userId) {
          return NextResponse.json(
            { error: 'Authentication required for personalized feed' },
            { status: 401 }
          )
        }
        result = await getPersonalizedFeed(userId, page, limit)
        break

      case 'public':
      default:
        result = await getPublicFeed(userId, page, limit)
        break
    }

    return createAPIResponse({
      ...result,
      feedType,
      userId: userId || null
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Remove advanced filtering in MVP
    return NextResponse.json(createAPIResponse({ message: 'Not implemented' }), { status: 501 })
  } catch (error) {
    return handleAPIError(error)
  }
}