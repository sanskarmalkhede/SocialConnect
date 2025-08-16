import { NextRequest, NextResponse } from 'next/server'
import { getPostById, updatePost, deletePost } from '@/lib/posts/post-service'
import { uploadPostImage, deletePostImage } from '@/lib/posts/post-image-upload'
import { validatePostForUpdate } from '@/lib/posts/post-validation'
import { handleAPIError, createAPIResponse, NotFoundError } from '@/lib/errors'
import { authenticateRequest, optionalAuth, requireOwnershipOrAdmin } from '@/lib/auth/middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    
    // Optional authentication for like status
    const auth = await optionalAuth(request)
    const userId = auth?.user.id

    const post = await getPostById(id, userId)
    if (!post) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Post not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createAPIResponse(post),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get post API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { user } = await authenticateRequest(request)

    // Check if post exists and get current data
    const existingPost = await getPostById(id)
    if (!existingPost) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Post not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    // Check ownership or admin
    await requireOwnershipOrAdmin(request, existingPost.author_id)

    const formData = await request.formData()
    const postData = {
      content: formData.get('content') as string,
      category: formData.get('category') as 'general' | 'announcement' | 'question',
      image_url: formData.get('image_url') as string || undefined
    }

    // Validate post data
    const validation = await validatePostForUpdate(postData)
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
      // Upload new image
      imageUrl = await uploadPostImage(user.id, imageFile)
      
      // Delete old image if it exists and is different
      if (existingPost.image_url && existingPost.image_url !== imageUrl) {
        await deletePostImage(existingPost.image_url)
      }
    } else if (postData.image_url === '' && existingPost.image_url) {
      // Image was removed
      await deletePostImage(existingPost.image_url)
      imageUrl = undefined
    }

    // Update post
    const updatedPost = await updatePost(id, user.id, {
      content: postData.content,
      category: postData.category,
      image_url: imageUrl
    })

    return NextResponse.json(
      createAPIResponse(updatedPost),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update post API error:', error)
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
    const { id } = params
    const { user, profile } = await authenticateRequest(request)

    // Check if post exists
    const existingPost = await getPostById(id)
    if (!existingPost) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Post not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    // Delete post (soft delete)
    await deletePost(id, user.id, profile.role === 'admin')

    // Delete associated image if it exists
    if (existingPost.image_url) {
      await deletePostImage(existingPost.image_url)
    }

    return NextResponse.json(
      createAPIResponse({ message: 'Post deleted successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete post API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}