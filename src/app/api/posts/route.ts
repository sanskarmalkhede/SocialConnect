import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/posts/post-service'
import { validatePostForCreation } from '@/lib/posts/post-validation'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { ValidationError } from '@/lib/errors'
import { authenticateRequest, optionalAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const authorId = searchParams.get('author_id') || undefined
    const category = searchParams.get('category') as 'general' | 'announcement' | 'question' | undefined

    // Optional authentication for like status
    const auth = await optionalAuth(request)
    const userId = auth?.user.id

    const result = await getPosts({
      page,
      limit,
      authorId,
      category,
      userId
    })

    return createAPIResponse(result)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    // Accept JSON payload from the client
    const body = await request.json()
    const postData = {
      content: body.content as string,
      category: body.category as 'general' | 'announcement' | 'question',
      image_url: (body.image_url as string | undefined) || undefined
    }

    // Validate post data
    const validation = await validatePostForCreation(postData)
    if (!validation.isValid) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid post data',
          code: 'VALIDATION_ERROR',
          details: Object.entries(validation.errors).map(([field, message]) => 
            new ValidationError(String(message), field)
          )
        }),
        { status: 400 }
      )
    }

    // Image uploads not handled in this JSON endpoint; use separate upload path if needed
    const imageUrl = postData.image_url

    // Create post
    const post = await createPost(user.id, {
      content: postData.content,
      category: postData.category,
      image_url: imageUrl
    })

    return createAPIResponse(post, 201)
  } catch (error) {
    return handleAPIError(error)
  }
}
