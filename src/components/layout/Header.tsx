
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, Home, User, Settings, LogOut } from 'lucide-react'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { useAuth } from '@/lib/auth/auth-helpers'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/feed"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              SC
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Feed
            </Link>
            <Link
              href={`/profile/${user?.username}`}
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <User className="h-5 w-5" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground justify-start">
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        <h1 className="text-lg font-semibold">Feed</h1>
      </div>
      <div className="relative flex items-center gap-4 md:grow-0">
        <NotificationBadge />
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>
    </header>
  )
}
