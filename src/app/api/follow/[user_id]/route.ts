import { NextRequest, NextResponse } from 'next/server'
import { followUser, unfollowUser, checkFollowStatus } from '@/lib/social/follow-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    user_id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user_id: targetUserId } = params
    const { user } = await authenticateRequest(request)

    await followUser(user.id, targetUserId)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'User followed successfully',
        following: true 
      }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user_id: targetUserId } = params
    const { user } = await authenticateRequest(request)

    await unfollowUser(user.id, targetUserId)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'User unfollowed successfully',
        following: false 
      }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user_id: targetUserId } = params
    const { user } = await authenticateRequest(request)

    const isFollowing = await checkFollowStatus(user.id, targetUserId)

    return NextResponse.json(
      createAPIResponse({ 
        following: isFollowing,
        user_id: targetUserId
      }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}