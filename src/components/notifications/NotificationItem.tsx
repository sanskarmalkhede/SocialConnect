
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type Notification } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
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
    <Link href={getNotificationLink()} className="block hover:bg-muted/50 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={notification.sender.avatar_url || ''} />
          <AvatarFallback>{notification.sender.username.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold">{notification.sender.username}</span> {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  )
}
