import { NextRequest, NextResponse } from 'next/server'
import { getFeedStats } from '@/lib/feed/feed-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    const stats = await getFeedStats(user.id)

    return NextResponse.json(
      createAPIResponse(stats),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get feed stats API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}