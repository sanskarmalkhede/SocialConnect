import { NextRequest, NextResponse } from 'next/server'
import { getSuggestedFollows, getFollowRecommendations } from '@/lib/social/follow-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Max 20 suggestions
    const type = searchParams.get('type') || 'suggested' // 'suggested' or 'recommended'

    let suggestions
    if (type === 'recommended') {
      suggestions = await getFollowRecommendations(user.id, limit)
    } else {
      suggestions = await getSuggestedFollows(user.id, limit)
    }

    return NextResponse.json(
      createAPIResponse({
        suggestions,
        type,
        count: suggestions.length
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get follow suggestions API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}