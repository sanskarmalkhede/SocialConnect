import { NextRequest, NextResponse } from 'next/server'
import { getProfileByUsername } from '@/lib/profile/profile-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { optionalAuth } from '@/lib/auth/middleware'

interface RouteParams {
  params: {
    username: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = params
    const auth = await optionalAuth(request)
    const currentUserId = auth?.user.id

    const profile = await getProfileByUsername(username, currentUserId)
    if (!profile) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Profile not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    // Basic visibility check (more detailed checks are in profile-service)
    if (profile.profile_visibility === 'private' && (!auth || auth.user.id !== profile.id)) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Profile not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createAPIResponse(profile),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
