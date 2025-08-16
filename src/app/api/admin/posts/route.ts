import { NextRequest, NextResponse } from 'next/server'
import { getPostsForModeration } from '@/lib/admin/admin-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { requireAdmin } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page for admin
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') as 'general' | 'announcement' | 'question' | undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam === null ? undefined : isActiveParam === 'true'
    const sortBy = searchParams.get('sortBy') as 'created_at' | 'like_count' | 'comment_count' || 'created_at'
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'

    const result = await getPostsForModeration({
      page,
      limit,
      search,
      category,
      isActive,
      sortBy,
      sortOrder
    })

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin get posts API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}