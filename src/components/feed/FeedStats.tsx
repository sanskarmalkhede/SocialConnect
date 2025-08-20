import React from 'react'

export interface FeedStatsProps {
  stats?: {
    totalPosts?: number
    totalUsers?: number
    topCategories?: { category: string; count: number }[]
    postsToday?: number
    activeUsers?: number
    engagementRate?: number
  }
}

export const FeedStats: React.FC<FeedStatsProps> = ({ stats }) => {
  if (!stats) return null
  return (
    <div className="p-4 border rounded-lg bg-muted">
      <h2 className="font-bold mb-2">Feed Stats</h2>
      <ul className="space-y-1 text-sm">
        <li>Total Posts: {stats.totalPosts ?? '-'}</li>
        <li>Total Users: {stats.totalUsers ?? '-'}</li>
        <li>Posts Today: {stats.postsToday ?? '-'}</li>
        <li>Active Users: {stats.activeUsers ?? '-'}</li>
        <li>Engagement Rate: {stats.engagementRate ? `${stats.engagementRate}%` : '-'}</li>
      </ul>
      {stats.topCategories && stats.topCategories.length > 0 && (
        <div className="mt-2">
          <div className="font-semibold">Top Categories:</div>
          <ul className="list-disc ml-5">
            {stats.topCategories.map((cat) => (
              <li key={cat.category}>{cat.category}: {cat.count}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FeedStats
