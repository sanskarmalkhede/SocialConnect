import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getPostById } from '@/lib/posts/post-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { handleDatabaseError, NotFoundError, ConflictError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    post_id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { post_id: postId } = params
    const { user } = await authenticateRequest(request)

    // Check if post exists
    const post = await getPostById(postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (existingBookmark) {
      throw new ConflictError('Post already bookmarked')
    }

    // Add bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        post_id: postId
      })

    if (error) {
      throw handleDatabaseError(error)
    }

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Post bookmarked successfully',
        bookmarked: true 
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Bookmark post API error:', error)
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
    const { post_id: postId } = params
    const { user } = await authenticateRequest(request)

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Bookmark removed successfully',
        bookmarked: false 
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Remove bookmark API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { post_id: postId } = params
    const { user } = await authenticateRequest(request)

    const { data, error } = await supabase
      .from('bookmarks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        createAPIResponse({ 
          post_id: postId,
          bookmarked: false 
        }),
        { status: 200 }
      )
    }

    if (error) {
      throw handleDatabaseError(error)
    }

    return NextResponse.json(
      createAPIResponse({ 
        post_id: postId,
        bookmarked: !!data 
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Check bookmark status API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}