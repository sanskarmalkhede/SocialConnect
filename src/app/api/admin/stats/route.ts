import { NextRequest, NextResponse } from 'next/server'
import { getPlatformStats, getModerationQueue } from '@/lib/admin/admin-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { requireAdmin } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const includeModeration = searchParams.get('include_moderation') === 'true'

    const stats = await getPlatformStats()
    
    let response: any = stats

    if (includeModeration) {
      const moderationQueue = await getModerationQueue(10)
      response = {
        ...stats,
        moderation: {
          queueSize: moderationQueue.length,
          recentItems: moderationQueue
        }
      }
    }

    return NextResponse.json(
      createAPIResponse(response),
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin get stats API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}