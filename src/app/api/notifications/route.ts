import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  getNotificationStats
} from '@/lib/notifications/notification-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const unreadOnly = searchParams.get('unread_only') === 'true'

    switch (action) {
      case 'count':
        const count = await getUnreadNotificationCount(user.id)
        return NextResponse.json(
          createAPIResponse({ unreadCount: count }),
          { status: 200 }
        )

      case 'stats':
        const stats = await getNotificationStats(user.id)
        return NextResponse.json(
          createAPIResponse(stats),
          { status: 200 }
        )

      default:
        const result = await getUserNotifications(user.id, page, limit, unreadOnly)
        return NextResponse.json(
          createAPIResponse(result),
          { status: 200 }
        )
    }
  } catch (error) {
    console.error('Get notifications API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'mark_all_read':
        await markAllNotificationsAsRead(user.id)
        return NextResponse.json(
          createAPIResponse({ message: 'All notifications marked as read' }),
          { status: 200 }
        )

      default:
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Invalid action',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Update notifications API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)

    await deleteAllNotifications(user.id)

    return NextResponse.json(
      createAPIResponse({ message: 'All notifications deleted' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete all notifications API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}