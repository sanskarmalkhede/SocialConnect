import { NextRequest, NextResponse } from 'next/server'
import { getFeedStats } from '@/lib/feed/feed-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { optionalAuthMiddleware } from '@/lib/auth/server-auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await optionalAuthMiddleware(request)
    const userId = session?.user?.id

    const result = await getFeedStats(userId)

    return createAPIResponse({ data: result })
  } catch (error) {
    return handleAPIError(error)
  }
}
