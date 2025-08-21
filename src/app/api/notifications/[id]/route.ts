import { NextRequest, NextResponse } from 'next/server'
import { 
  getNotificationById,
  markNotificationAsRead,
  deleteNotification
} from '@/lib/notifications/notification-service'
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler'
import { AuthorizationError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/auth-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: notificationId } = params
    const { user } = await authenticateRequest(request)

    const notification = await getNotificationById(notificationId)
    if (!notification) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Notification not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      )
    }

    // Check if user owns the notification
    if (notification.recipient_id !== user.id) {
      throw new AuthorizationError('You can only access your own notifications')
    }

    return NextResponse.json(
      createAPIResponse(notification),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: notificationId } = params
    const { user } = await authenticateRequest(request)
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'mark_read':
        await markNotificationAsRead(notificationId, user.id)
        return NextResponse.json(
          createAPIResponse({ 
            message: 'Notification marked as read',
            notificationId 
          }),
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
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: notificationId } = params
    const { user } = await authenticateRequest(request)

    await deleteNotification(notificationId, user.id)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Notification deleted',
        notificationId 
      }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
