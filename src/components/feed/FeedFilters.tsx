'use client'

import { useState } from 'react'
import { Filter, SlidersHorizontal, X, Calendar, Tag, User, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { POST_CATEGORY_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

export interface FeedFilters {
  category?: 'general' | 'announcement' | 'question'
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'all'
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'trending'
  authorIds?: string[]
}

interface FeedFiltersProps {
  filters: FeedFilters
  onFiltersChange: (filters: FeedFilters) => void
  className?: string
}

export function FeedFilters({
  filters,
  onFiltersChange,
  className
}: FeedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof FeedFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilter = (key: keyof FeedFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    return Object.keys(filters).length
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {POST_CATEGORY_LABELS[filters.category]}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('category')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.timeframe && filters.timeframe !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {filters.timeframe}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('timeframe')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.sortBy && filters.sortBy !== 'newest' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {getSortLabel(filters.sortBy)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('sortBy')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => 
                    updateFilter('category', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="general">{POST_CATEGORY_LABELS.general}</SelectItem>
                    <SelectItem value="announcement">{POST_CATEGORY_LABELS.announcement}</SelectItem>
                    <SelectItem value="question">{POST_CATEGORY_LABELS.question}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Timeframe Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select
                  value={filters.timeframe || 'all'}
                  onValueChange={(value) => 
                    updateFilter('timeframe', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="hour">Last hour</SelectItem>
                    <SelectItem value="day">Last 24 hours</SelectItem>
                    <SelectItem value="week">Last week</SelectItem>
                    <SelectItem value="month">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Sort By Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                  value={filters.sortBy || 'newest'}
                  onValueChange={(value) => 
                    updateFilter('sortBy', value === 'newest' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Newest first" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="most_liked">Most liked</SelectItem>
                    <SelectItem value="most_commented">Most commented</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function getSortLabel(sortBy: string): string {
  switch (sortBy) {
    case 'oldest':
      return 'Oldest'
    case 'most_liked':
      return 'Most Liked'
    case 'most_commented':
      return 'Most Commented'
    case 'trending':
      return 'Trending'
    default:
      return 'Newest'
  }
}

interface QuickFiltersProps {
  onCategorySelect: (category: 'general' | 'announcement' | 'question' | null) => void
  onTimeframeSelect: (timeframe: 'hour' | 'day' | 'week' | null) => void
  selectedCategory?: 'general' | 'announcement' | 'question' | null
  selectedTimeframe?: 'hour' | 'day' | 'week' | null
  className?: string
}

export function QuickFilters({
  onCategorySelect,
  onTimeframeSelect,
  selectedCategory,
  selectedTimeframe,
  className
}: QuickFiltersProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Category Quick Filters */}
      <div className="flex gap-1">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect(null)}
        >
          All
        </Button>
        <Button
          variant={selectedCategory === 'general' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect('general')}
        >
          General
        </Button>
        <Button
          variant={selectedCategory === 'announcement' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect('announcement')}
        >
          Announcements
        </Button>
        <Button
          variant={selectedCategory === 'question' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect('question')}
        >
          Questions
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Timeframe Quick Filters */}
      <div className="flex gap-1">
        <Button
          variant={selectedTimeframe === 'hour' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeSelect('hour')}
        >
          1H
        </Button>
        <Button
          variant={selectedTimeframe === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeSelect('day')}
        >
          24H
        </Button>
        <Button
          variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeSelect('week')}
        >
          7D
        </Button>
      </div>
    </div>
  )
}