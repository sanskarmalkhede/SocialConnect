
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type Notification } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Check, Trash2 } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getNotificationLink = () => {
    if (notification.post_id) {
      return `/post/${notification.post_id}`
    }
    if (notification.notification_type === 'follow') {
      return `/profile/${notification.sender.username}`
    }
    return '#'
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
      <Link href={getNotificationLink()} className="flex-shrink-0">
        <Avatar>
          <AvatarImage src={notification.sender.avatar_url || ''} />
          <AvatarFallback>{notification.sender.username.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={getNotificationLink()} className="block">
          <p className="text-sm break-words">
            <span className="font-semibold">{notification.sender.username}</span> {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </Link>
      </div>
      <div className="flex-shrink-0 flex gap-1">
        {!notification.is_read && onMarkAsRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => void
  onDelete: (notificationId: string) => void
}

export function NotificationList({ notifications, onMarkAsRead, onDelete }: NotificationListProps) {
  return (
    <div className="divide-y divide-border">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
