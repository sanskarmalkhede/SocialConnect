'use client'

import { useState, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { postFormSchema } from '@/lib/posts/post-validation'
import { validatePostImageFile } from '@/lib/posts/post-image-upload'
import { getInitials } from '@/lib/format'
import { POST_CATEGORY_LABELS, CONTENT_LIMITS } from '@/constants'
import type { PostFormData } from '@/types'
import type { Profile } from '@/lib/supabase/types'
import { toast } from 'sonner'

interface PostFormProps {
  profile: Profile
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData & { image?: File }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  isEditing?: boolean
}

export function PostForm({
  profile,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false
}: PostFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: initialData?.content || '',
      category: initialData?.category || 'general',
      image_url: initialData?.image_url || ''
    }
  })

  const watchedContent = form.watch('content')

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      validatePostImageFile(file)
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file')
      event.target.value = '' // Reset input
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    form.setValue('image_url', '')
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (data: PostFormData) => {
    try {
      await onSubmit({
        ...data,
        image: imageFile || undefined
      })
    } catch (error) {
      console.error('Post submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save post')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
            <AvatarFallback>
              {getInitials(profile.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {isEditing ? 'Edit Post' : 'Create Post'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share your thoughts with the community
            </p>
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Post Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      className="resize-none min-h-[100px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchedContent?.length || 0}/{CONTENT_LIMITS.POST_MAX_LENGTH} characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">
                        {POST_CATEGORY_LABELS.general}
                      </SelectItem>
                      <SelectItem value="announcement">
                        {POST_CATEGORY_LABELS.announcement}
                      </SelectItem>
                      <SelectItem value="question">
                        {POST_CATEGORY_LABELS.question}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the most appropriate category for your post
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Image (optional)
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Post preview"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover max-h-[300px]"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImageUploadClick}
                  disabled={isLoading}
                  className="w-full h-24 border-dashed"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-sm">Add Image</span>
                  </div>
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground">
                JPEG or PNG, max 2MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          </CardContent>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 p-6 pt-0">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !watchedContent?.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}