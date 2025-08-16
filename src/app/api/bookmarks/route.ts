import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { handleDatabaseError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page

    const offset = (page - 1) * limit

    // Get bookmarked posts
    const { data, error, count } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        post:posts!bookmarks_post_id_fkey (
          *,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_url,
            role,
            profile_visibility
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('post.is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw handleDatabaseError(error)
    }

    const posts = data?.map(item => ({
      ...item.post,
      is_bookmarked: true,
      bookmarked_at: item.created_at
    })) || []

    return NextResponse.json(
      createAPIResponse({
        posts,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get bookmarks API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}