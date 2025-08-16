import { NextRequest, NextResponse } from 'next/server'
import { deletePostAsAdmin, restorePostAsAdmin } from '@/lib/admin/admin-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { requireAdmin } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)
    
    const { id: postId } = params
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'delete':
        await deletePostAsAdmin(postId)
        return NextResponse.json(
          createAPIResponse({ 
            message: 'Post deleted successfully',
            postId
          }),
          { status: 200 }
        )

      case 'restore':
        await restorePostAsAdmin(postId)
        return NextResponse.json(
          createAPIResponse({ 
            message: 'Post restored successfully',
            postId
          }),
          { status: 200 }
        )

      default:
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Invalid action. Supported actions: delete, restore',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin post action API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}