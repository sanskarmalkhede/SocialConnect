
import { NextRequest } from 'next/server'
import { getPersonalizedFeed, getPublicFeed } from '@/lib/feed/feed-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    let result
    if (session?.user) {
      result = await getPersonalizedFeed(session.user.id, page, limit)
    } else {
      result = await getPublicFeed(undefined, page, limit)
    }

    return createAPIResponse({ data: result })
  } catch (error) {
    return handleAPIError(error)
  }
}
