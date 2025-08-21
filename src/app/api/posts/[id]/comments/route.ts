import { NextRequest, NextResponse } from 'next/server'
import { createComment, getPostComments } from '@/lib/social/comment-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long')
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { user } = await authenticateRequest(request)
    
    const body = await request.json()
    const { content } = createCommentSchema.parse(body)

    const comment = await createComment(user.id, postId, content)

    return NextResponse.json(
      createAPIResponse(comment, 'Comment created successfully'),
      { status: 201 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await getPostComments(postId, page, limit)

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
