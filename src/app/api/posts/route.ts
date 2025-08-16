import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/posts/post-service'
import { uploadPostImage } from '@/lib/posts/post-image-upload'
import { validatePostForCreation } from '@/lib/posts/post-validation'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
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

    return NextResponse.json(
      createAPIResponse(result),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get posts API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    const formData = await request.formData()
    const postData = {
      content: formData.get('content') as string,
      category: formData.get('category') as 'general' | 'announcement' | 'question',
      image_url: formData.get('image_url') as string || undefined
    }

    // Validate post data
    const validation = await validatePostForCreation(postData)
    if (!validation.isValid) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid post data',
          code: 'VALIDATION_ERROR',
          details: Object.entries(validation.errors).map(([field, message]) => ({
            field,
            message
          }))
        }),
        { status: 400 }
      )
    }

    // Handle image upload if present
    const imageFile = formData.get('image') as File | null
    let imageUrl = postData.image_url

    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadPostImage(user.id, imageFile)
    }

    // Create post
    const post = await createPost(user.id, {
      content: postData.content,
      category: postData.category,
      image_url: imageUrl
    })

    return NextResponse.json(
      createAPIResponse(post),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create post API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}