import { NextRequest, NextResponse } from 'next/server'
import { getPersonalizedFeed, getPublicFeed } from '@/lib/feed/feed-service'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createAPIResponse, handleAPIError } from '@/lib/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Accept Bearer token
    const authHeader = request.headers.get('authorization')
    let userId: string | undefined
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (!error && data.user) {
        userId = data.user.id
      }
    }

    let result
    if (userId) {
      result = await getPersonalizedFeed(userId, page, limit)
    } else {
      result = await getPublicFeed(undefined, page, limit)
    }

    return createAPIResponse({ data: result })
  } catch (error) {
    return handleAPIError(error)
  }
}
