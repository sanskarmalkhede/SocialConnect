import { NextRequest, NextResponse } from 'next/server'
import { likePost, unlikePost, checkLikeStatus } from '@/lib/social/like-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { user } = await authenticateRequest(request)

    await likePost(user.id, postId)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Post liked successfully',
        post_id: postId,
        is_liked: true
      }),
      { status: 200 }
    )
  } catch (error) {
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { user } = await authenticateRequest(request)

    await unlikePost(user.id, postId)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Post unliked successfully',
        post_id: postId,
        is_liked: false
      }),
      { status: 200 }
    )
  } catch (error) {
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { user } = await authenticateRequest(request)

    const isLiked = await checkLikeStatus(user.id, postId)

    return NextResponse.json(
      createAPIResponse({ 
        post_id: postId,
        is_liked: isLiked
      }),
      { status: 200 }
    )
  } catch (error) {
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}