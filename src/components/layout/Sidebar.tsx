
'use client'

import Link from 'next/link'
import { Home, User, Settings, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-helpers'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'

export function Sidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col gap-4 px-4 py-6">
        <Link
          href="/feed"
          className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-4"
        >
          SC
        </Link>
        <Link
          href="/feed"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Home className="h-4 w-4" />
          Feed
        </Link>
        <Link
          href={`/profile/${user?.username}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          Notifications
          <NotificationBadge />
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>
      <div className="mt-auto p-4">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
