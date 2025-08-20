import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants'

export default function FeedPage() {
  // Redirect to dashboard where the feed actually exists
  redirect(ROUTES.DASHBOARD)
}
