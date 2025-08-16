'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { validatePostImageFile } from '@/lib/posts/post-image-upload'
import { formatFileSize } from '@/lib/format'
import { toast } from 'sonner'

interface PostImageUploadProps {
  onImageSelect: (file: File | null) => void
  currentImageUrl?: string
  disabled?: boolean
  maxSizeMB?: number
}

export function PostImageUpload({
  onImageSelect,
  currentImageUrl,
  disabled = false,
  maxSizeMB = 2
}: PostImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file
      validatePostImageFile(file)

      setIsUploading(true)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        onImageSelect(file)
        setIsUploading(false)
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageSelect(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            {isUploading ? (
              <div className="flex items-center justify-center h-48 bg-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Image
                src={previewUrl}
                alt="Post image preview"
                width={600}
                height={400}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            )}
            
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
          className="w-full h-32 border-dashed hover:bg-muted/50"
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {isUploading ? 'Processing...' : 'Add Image'}
              </p>
              <p className="text-xs text-muted-foreground">
                Click to upload or drag and drop
              </p>
            </div>
          </div>
        </Button>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>JPEG or PNG, max {maxSizeMB}MB</span>
        {previewUrl && !currentImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className="h-auto p-1 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Change
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}

interface PostImageUploadFieldProps extends PostImageUploadProps {
  label?: string
  description?: string
  error?: string
}

export function PostImageUploadField({
  label = 'Image',
  description = 'Add an image to your post (optional)',
  error,
  ...props
}: PostImageUploadFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <PostImageUpload {...props} />
      
      {description && !error && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface DragDropImageUploadProps extends PostImageUploadProps {
  onDrop?: (files: FileList) => void
}

export function DragDropImageUpload({
  onDrop,
  ...props
}: DragDropImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onDrop?.(files)
      
      // Simulate file input change for the first file
      const file = files[0]
      if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        try {
          validatePostImageFile(file)
          props.onImageSelect(file)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Invalid file')
        }
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-colors ${isDragOver ? 'bg-muted/50' : ''}`}
    >
      <PostImageUpload {...props} />
    </div>
  )
}