'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MoreHorizontal, Shield, ShieldOff, UserX, UserCheck, Eye } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, formatCount, getInitials } from '@/lib/format'
import type { Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UserManagementProps {
  onUpdateUserRole?: (userId: string, role: 'user' | 'admin') => Promise<void>
  onToggleUserStatus?: (userId: string, isActive: boolean) => Promise<void>
  onViewUserDetails?: (userId: string) => void
  className?: string
}

export function UserManagement({
  onUpdateUserRole,
  onToggleUserStatus,
  onViewUserDetails,
  className
}: UserManagementProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'username' | 'post_count'>('created_at')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    loadUsers()
  }, [searchQuery, roleFilter, sortBy, page])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call the admin service
      // const result = await getUsers({ page, search: searchQuery, role: roleFilter === 'all' ? undefined : roleFilter, sortBy })
      
      // Mock data
      const mockUsers: Profile[] = [
        {
          id: '1',
          username: 'john_doe',
          bio: 'Software developer and tech enthusiast',
          avatar_url: null,
          role: 'user',
          profile_visibility: 'public',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          post_count: 25,
          follower_count: 150,
          following_count: 75,
          is_active: true
        },
        {
          id: '2',
          username: 'admin_user',
          bio: 'Platform administrator',
          avatar_url: null,
          role: 'admin',
          profile_visibility: 'public',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
          post_count: 5,
          follower_count: 500,
          following_count: 20,
          is_active: true
        }
      ]

      setUsers(mockUsers)
      setHasMore(false)
    } catch (error) {
      console.error('Load users error:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await onUpdateUserRole?.(userId, newRole)
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Update role error:', error)
      toast.error('Failed to update user role')
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await onToggleUserStatus?.(userId, isActive)
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ))
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Toggle status error:', error)
      toast.error('Failed to update user status')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Join Date</SelectItem>
              <SelectItem value="username">Username</SelectItem>
              <SelectItem value="post_count">Posts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                          <AvatarFallback>
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {user.bio && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {user.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(user.is_active || true)}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>{formatCount(user.post_count || 0)} posts</div>
                        <div className="text-muted-foreground">
                          {formatCount(user.follower_count || 0)} followers
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatRelativeTime(user.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewUserDetails?.(user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {user.role === 'user' ? (
                            <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'user')}>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {user.is_active !== false ? (
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.id, false)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, true)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}