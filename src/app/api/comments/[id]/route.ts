import { NextRequest, NextResponse } from 'next/server'
import { updateComment, deleteComment, getCommentById } from '@/lib/social/comment-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long')
})

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = params
    
    const comment = await getCommentById(commentId)
    
    if (!comment) {
      return NextResponse.json(
        handleAPIError(new Error('Comment not found')),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createAPIResponse(comment),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get comment API error:', error)
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
    const { id: commentId } = params
    const { user } = await authenticateRequest(request)
    
    const body = await request.json()
    const { content } = updateCommentSchema.parse(body)

    const updatedComment = await updateComment(commentId, user.id, content)

    return NextResponse.json(
      createAPIResponse(updatedComment, 'Comment updated successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update comment API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = params
    const { user, profile } = await authenticateRequest(request)
    
    const isAdmin = profile?.role === 'admin'
    await deleteComment(commentId, user.id, isAdmin)

    return NextResponse.json(
      createAPIResponse({ message: 'Comment deleted successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete comment API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}