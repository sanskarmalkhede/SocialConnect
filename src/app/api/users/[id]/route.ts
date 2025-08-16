import { NextRequest, NextResponse } from 'next/server'
import { getProfileById, updateProfile } from '@/lib/profile/profile-service'
import { updateUserAvatar } from '@/lib/profile/avatar-upload'
import { profileSchema } from '@/lib/validations'
import { handleAPIError, createAPIResponse, NotFoundError } from '@/lib/errors'
import { optionalAuth, requireOwnershipOrAdmin } from '@/lib/auth/middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const auth = await optionalAuth(request)

    // Get profile
    const profile = await getProfileById(id)
    if (!profile) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Profile not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    // Check if user can view this profile based on visibility settings
    if (profile.profile_visibility === 'private' && (!auth || auth.user.id !== id)) {
      // Check if user is admin
      if (!auth || auth.profile.role !== 'admin') {
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Profile not found',
            code: 'NOT_FOUND'
          }),
          { status: 404 }
        )
      }
    }

    if (profile.profile_visibility === 'followers_only' && (!auth || auth.user.id !== id)) {
      // Check if user is admin or follower
      if (!auth || auth.profile.role !== 'admin') {
        // TODO: Check if user is following this profile
        // For now, we'll allow access - this will be implemented with the follow system
      }
    }

    return NextResponse.json(
      createAPIResponse(profile),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get profile API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    // Authenticate and authorize
    await requireOwnershipOrAdmin(request, id)

    const formData = await request.formData()
    const profileData = {
      username: formData.get('username') as string,
      bio: formData.get('bio') as string || undefined,
      website: formData.get('website') as string || undefined,
      location: formData.get('location') as string || undefined,
      profile_visibility: formData.get('profile_visibility') as 'public' | 'private' | 'followers_only'
    }

    // Validate profile data
    const validationResult = profileSchema.safeParse(profileData)
    if (!validationResult.success) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }),
        { status: 400 }
      )
    }

    // Handle avatar upload if present
    const avatarFile = formData.get('avatar') as File | null
    let updatedProfile = await updateProfile(id, validationResult.data)

    if (avatarFile && avatarFile.size > 0) {
      const avatarUrl = await updateUserAvatar(id, avatarFile, updatedProfile.avatar_url || undefined)
      // Update profile with new avatar URL
      updatedProfile = await updateProfile(id, { 
        ...validationResult.data,
        avatar_url: avatarUrl 
      } as any)
    }

    return NextResponse.json(
      createAPIResponse(updatedProfile),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update profile API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}