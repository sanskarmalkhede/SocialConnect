import { NextRequest, NextResponse } from 'next/server'
import { getProfileById, updateProfile } from '@/lib/profile/profile-service'
import { updateUserAvatar } from '@/lib/profile/avatar-upload'
import { profileSchema } from '@/lib/validations'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { optionalAuth, requireOwnershipOrAdmin } from '@/lib/auth/middleware'
import { ZodIssue } from 'zod'
import { Profile } from '@/types'

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
    return handleAPIError(error)
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
          details: validationResult.error.issues.map((err: ZodIssue) => ({
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
      } as Partial<Profile>)
    }

    return NextResponse.json(
      createAPIResponse(updatedProfile),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    // Authenticate and authorize
    await requireOwnershipOrAdmin(request, id)

    const body = await request.json()
    
    // For PATCH, we only update provided fields
    const updateData: Partial<Profile> = {}
    
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
          details: validationResult.error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }),
        { status: 400 }
      )
    }

    const updatedProfile = await updateProfile(id, validationResult.data)

    return NextResponse.json(
      createAPIResponse(updatedProfile),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
