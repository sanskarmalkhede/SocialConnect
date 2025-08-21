'use client'

import { useState, useRef } from 'react'
import { MessageCircle, Send, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, getInitials } from '@/lib/format'
import { CONTENT_LIMITS } from '@/constants'
import type { Comment, Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  currentUser?: Profile
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onAddComment?: (content: string) => Promise<void>
  onEditComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  className?: string
}

export function CommentSection({
  postId: _postId,
  comments,
  currentUser,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onAddComment,
  onEditComment,
  onDeleteComment,
  className
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onAddComment || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment('')
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Add comment error:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !onEditComment) return

    try {
      await onEditComment(commentId, editContent.trim())
      setEditingCommentId(null)
      setEditContent('')
      toast.success('Comment updated successfully')
    } catch (error) {
      console.error('Edit comment error:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) return

    try {
      await onDeleteComment(commentId)
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Delete comment error:', error)
      toast.error('Failed to delete comment')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const canEditComment = (comment: Comment) => {
    return currentUser && comment.author_id === currentUser.id
  }

  const canDeleteComment = (comment: Comment) => {
    return currentUser && (
      comment.author_id === currentUser.id || // Own comment
      currentUser.role === 'admin' // Admin
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Comment Input */}
      {currentUser && onAddComment && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
                <AvatarFallback className="text-xs">
                  {getInitials(currentUser.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none min-h-[60px]"
                  maxLength={CONTENT_LIMITS.COMMENT_MAX_LENGTH}
                  disabled={isSubmitting}
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/{CONTENT_LIMITS.COMMENT_MAX_LENGTH}
                  </span>
                  
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading && comments.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author.avatar_url || undefined} alt={comment.author.username} />
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.author.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.author.username}</span>
                        {comment.author.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.created_at)}
                          {comment.updated_at !== comment.created_at && (
                            <span className="ml-1">(edited)</span>
                          )}
                        </span>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="resize-none min-h-[60px]"
                            maxLength={CONTENT_LIMITS.COMMENT_MAX_LENGTH}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleEditComment(comment.id)}
                              disabled={!editContent.trim()}
                              size="sm"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      )}
                    </div>
                    
                    {/* Comment Actions */}
                    {(canEditComment(comment) || canDeleteComment(comment)) && editingCommentId !== comment.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditComment(comment) && (
                            <DropdownMenuItem onClick={() => startEditing(comment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteComment(comment) && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  onClick={onLoadMore}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Load More Comments
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface CompactCommentSectionProps extends Omit<CommentSectionProps, 'className'> {
  maxVisible?: number
}

export function CompactCommentSection({
  maxVisible = 3,
  ...props
}: CompactCommentSectionProps) {
  const visibleComments = props.comments.slice(0, maxVisible)
  const remainingCount = props.comments.length - maxVisible

  return (
    <div className="space-y-2">
      {visibleComments.map((comment) => (
        <div key={comment.id} className="flex gap-2 text-sm">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={comment.author.avatar_url || undefined} alt={comment.author.username} />
            <AvatarFallback className="text-xs">
              {getInitials(comment.author.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{comment.author.username}</span>
            <span className="ml-2">{comment.content}</span>
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View {remainingCount} more {remainingCount === 1 ? 'comment' : 'comments'}
        </Button>
      )}
    </div>
  )
}