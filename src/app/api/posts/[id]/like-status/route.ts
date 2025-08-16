import { NextRequest, NextResponse } from 'next/server'
import { getPostLikeStatus } from '@/lib/posts/post-service'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { user } = await authenticateRequest(request)

    const isLiked = await getPostLikeStatus(user.id, postId)

    return NextResponse.json(
      createAPIResponse({ 
        post_id: postId,
        is_liked: isLiked
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get post like status API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}