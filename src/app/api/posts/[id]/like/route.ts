
import { NextRequest, NextResponse } from 'next/server'
import { likePost, unlikePost } from '@/lib/social/like-service'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { requireAuthMiddleware } from '@/lib/auth/server-auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuthMiddleware(request)
    const userId = session.user.id
    const postId = params.id

    await likePost(userId, postId)

    return NextResponse.json(
      createAPIResponse(null, { message: 'Successfully liked post' }),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuthMiddleware(request)
    const userId = session.user.id
    const postId = params.id

    await unlikePost(userId, postId)

    return NextResponse.json(
      createAPIResponse(null, { message: 'Successfully unliked post' }),
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
