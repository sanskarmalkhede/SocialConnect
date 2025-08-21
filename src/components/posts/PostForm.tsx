'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth/auth-helpers'
import { createPost } from '@/lib/posts/post-service'
import { uploadPostImage } from '@/lib/posts/post-image-upload'
import { useToast } from '@/hooks/use-toast'

interface PostFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PostForm({ open, onOpenChange, onSuccess }: PostFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Error', description: 'Image size must be less than 5MB', variant: 'destructive' })
        return
      }
      setImageFile(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !content.trim()) return

    setIsLoading(true)
    try {
      let imageUrl: string | undefined = undefined
      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile, user.id)
      }

      await createPost({ content, image_url: imageUrl }, user.id)

      toast({ title: 'Success', description: 'Post created successfully.' })
      setContent('')
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create post.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
          />
          {imageFile && (
            <div className="relative">
              <Image
                src={URL.createObjectURL(imageFile)}
                alt="Selected image preview"
                width={500}
                height={500}
                className="rounded-md object-cover w-full h-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => setImageFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              className="hidden"
              id="post-image-upload"
            />
            <label htmlFor="post-image-upload">
              <Button type="button" variant="outline" asChild>
                <span>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Image
                </span>
              </Button>
            </label>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}