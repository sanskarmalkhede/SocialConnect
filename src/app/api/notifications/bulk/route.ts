import { NextRequest, NextResponse } from 'next/server'
import { 
  bulkMarkNotificationsAsRead,
  bulkDeleteNotifications
} from '@/lib/notifications/notification-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    const body = await request.json()
    const { action, notificationIds } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'notificationIds must be a non-empty array',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    switch (action) {
      case 'mark_read':
        await bulkMarkNotificationsAsRead(notificationIds, user.id)
        return NextResponse.json(
          createAPIResponse({ 
            message: `${notificationIds.length} notifications marked as read`,
            count: notificationIds.length
          }),
          { status: 200 }
        )

      default:
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Invalid action. Supported actions: mark_read',
            code: 'VALIDATION_ERROR'
          }),
          { status: 400 }
        )
    }
  } catch (error) {
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
    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'notificationIds must be a non-empty array',
          code: 'VALIDATION_ERROR'
        }),
        { status: 400 }
      )
    }

    await bulkDeleteNotifications(notificationIds, user.id)

    return NextResponse.json(
      createAPIResponse({ 
        message: `${notificationIds.length} notifications deleted`,
        count: notificationIds.length
      }),
      { status: 200 }
    )
  } catch (error) {
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}