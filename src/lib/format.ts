import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

/**
 * Format a date for display in posts, comments, etc.
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(dateObj)) {
    return format(dateObj, 'h:mm a')
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }
  
  // If within the last week, show relative time
  const daysDiff = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff < 7) {
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }
  
  // If within the current year, show month and day
  if (dateObj.getFullYear() === new Date().getFullYear()) {
    return format(dateObj, 'MMM d')
  }
  
  // Otherwise show full date
  return format(dateObj, 'MMM d, yyyy')
}

/**
 * Format a full date and time for detailed views
 */
export function formatFullDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'PPP p') // e.g., "April 29, 2023 at 1:45 PM"
}

/**
 * Format numbers with appropriate suffixes (1K, 1M, etc.)
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  }
  
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }
  
  if (count < 1000000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  }
  
  return `${(count / 1000000000).toFixed(1).replace(/\.0$/, '')}B`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate initials from a name or username
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Generate a random color for avatars
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ]
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}