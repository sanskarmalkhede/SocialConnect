import { NextRequest, NextResponse } from 'next/server'
import { 
  getPersonalizedFeed, 
  getPublicFeed, 
  getTrendingFeed, 
  getCategoryFeed,
  getAdvancedFeed,
  getFeedStats
} from '@/lib/feed/feed-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest, optionalAuth } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get('type') as 'personalized' | 'public' | 'trending' | 'category' || 'public'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const category = searchParams.get('category') as 'general' | 'announcement' | 'question' | null
    const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' | null
    const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'trending' | null

    // Optional authentication for personalized features
    const auth = await optionalAuth(request)
    const userId = auth?.user.id

    let result

    switch (feedType) {
      case 'personalized':
        if (!userId) {
          return NextResponse.json(
            createAPIResponse(undefined, {
              message: 'Authentication required for personalized feed',
              code: 'AUTHENTICATION_REQUIRED'
            }),
            { status: 401 }
          )
        }
        result = await getPersonalizedFeed(userId, page, limit)
        break

      case 'trending':
        result = await getTrendingFeed(
          userId, 
          timeframe || 'day', 
          page, 
          limit
        )
        break

      case 'category':
        if (!category) {
          return NextResponse.json(
            createAPIResponse(undefined, {
              message: 'Category parameter required for category feed',
              code: 'VALIDATION_ERROR'
            }),
            { status: 400 }
          )
        }
        result = await getCategoryFeed(category, userId, page, limit)
        break

      case 'public':
      default:
        result = await getPublicFeed(userId, page, limit)
        break
    }

    return NextResponse.json(
      createAPIResponse({
        ...result,
        feedType,
        userId: userId || null
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get feed API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const body = await request.json()

    const {
      feedType = 'public',
      category,
      timeframe = 'all',
      sortBy = 'newest',
      authorIds,
      excludeAuthorIds,
      page = 1,
      limit = 20
    } = body

    const result = await getAdvancedFeed({
      userId: user.id,
      feedType,
      category,
      timeframe,
      sortBy,
      authorIds,
      excludeAuthorIds,
      page,
      limit: Math.min(limit, 50)
    })

    return NextResponse.json(
      createAPIResponse({
        ...result,
        feedType,
        filters: {
          category,
          timeframe,
          sortBy,
          authorIds,
          excludeAuthorIds
        }
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Advanced feed API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}