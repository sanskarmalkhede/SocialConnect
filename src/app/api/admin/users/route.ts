import { NextRequest, NextResponse } from 'next/server'
import { getUsers, bulkUpdateUsers } from '@/lib/admin/admin-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { requireAdmin } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page for admin
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') as 'user' | 'admin' | undefined
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'username' | 'post_count' | 'follower_count' || 'created_at'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    const result = await getUsers({
      page,
      limit,
      search,
      role,
      sortBy,
      sortOrder
    })

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin get users API error:', error)
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
    await requireAdmin(request)
    
    const body = await request.json()
    const { userIds, updates } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'userIds must be a non-empty array',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'updates object is required',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    const result = await bulkUpdateUsers(userIds, updates)

    return NextResponse.json(
      createAPIResponse({
        message: `Bulk update completed`,
        successful: result.successful,
        failed: result.failed,
        totalProcessed: userIds.length
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin bulk update users API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}