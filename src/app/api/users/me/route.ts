import { NextRequest, NextResponse } from 'next/server'
import { getProfileById, updateProfile } from '@/lib/profile/profile-service'
import { updateUserAvatar } from '@/lib/profile/avatar-upload'
import { profileSchema } from '@/lib/validations'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    // Get current user's profile
    const profile = await getProfileById(user.id)
    if (!profile) {
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
    console.error('Get current user profile API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

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
    let updatedProfile = await updateProfile(user.id, validationResult.data)

    if (avatarFile && avatarFile.size > 0) {
      const avatarUrl = await updateUserAvatar(user.id, avatarFile, updatedProfile.avatar_url || undefined)
      // Update profile with new avatar URL
      updatedProfile = await updateProfile(user.id, { 
        ...validationResult.data,
        avatar_url: avatarUrl 
      } as any)
    }

    return NextResponse.json(
      createAPIResponse(updatedProfile),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update current user profile API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    const body = await request.json()
    
    // For PATCH, we only update provided fields
    const updateData: any = {}
    
    if (body.username !== undefined) updateData.username = body.username
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.website !== undefined) updateData.website = body.website
    if (body.location !== undefined) updateData.location = body.location
    if (body.profile_visibility !== undefined) updateData.profile_visibility = body.profile_visibility

    // Validate only the fields being updated
    const validationResult = profileSchema.partial().safeParse(updateData)
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

    const updatedProfile = await updateProfile(user.id, validationResult.data)

    return NextResponse.json(
      createAPIResponse(updatedProfile),
      { status: 200 }
    )
  } catch (error) {
    console.error('Patch current user profile API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}