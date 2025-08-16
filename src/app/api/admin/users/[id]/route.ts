import { NextRequest, NextResponse } from 'next/server'
import { getUserDetails, updateUserRole, toggleUserStatus } from '@/lib/admin/admin-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { requireAdmin } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)
    
    const { id: userId } = params
    const userDetails = await getUserDetails(userId)

    return NextResponse.json(
      createAPIResponse(userDetails),
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin get user details API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)
    
    const { id: userId } = params
    const body = await request.json()
    const { action, role, isActive } = body

    switch (action) {
      case 'update_role':
        if (!role || !['user', 'admin'].includes(role)) {
          return NextResponse.json(
            createAPIResponse(undefined, {
              message: 'Valid role (user or admin) is required',
              code: 'VALIDATION_ERROR'
            }),
            { status: 400 }
          )
        }
        
        await updateUserRole(userId, role)
        return NextResponse.json(
          createAPIResponse({ 
            message: `User role updated to ${role}`,
            userId,
            role
          }),
          { status: 200 }
        )

      case 'toggle_status':
        if (typeof isActive !== 'boolean') {
          return NextResponse.json(
            createAPIResponse(undefined, {
              message: 'isActive boolean value is required',
              code: 'VALIDATION_ERROR'
            }),
            { status: 400 }
          )
        }
        
        await toggleUserStatus(userId, isActive)
        return NextResponse.json(
          createAPIResponse({ 
            message: `User ${isActive ? 'activated' : 'deactivated'}`,
            userId,
            isActive
          }),
          { status: 200 }
        )

      default:
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Invalid action. Supported actions: update_role, toggle_status',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin update user API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}