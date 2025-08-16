'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { validateAvatarFile } from '@/lib/profile/avatar-upload'
import { getInitials } from '@/lib/format'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  username: string
  onAvatarChange: (file: File | null) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24'
}

export function AvatarUpload({
  currentAvatarUrl,
  username,
  onAvatarChange,
  disabled = false,
  size = 'md'
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file
      validateAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        onAvatarChange(file)
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

  const handleRemoveAvatar = () => {
    setPreviewUrl(null)
    onAvatarChange(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const displayAvatarUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={displayAvatarUrl || undefined} alt={username} />
          <AvatarFallback className={size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg'}>
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {currentAvatarUrl || previewUrl ? 'Change' : 'Upload'}
          </Button>
          
          {(displayAvatarUrl || previewUrl) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          JPEG or PNG, max 2MB
        </p>
      </div>

      {/* Hidden File Input */}
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

interface AvatarUploadFieldProps extends AvatarUploadProps {
  label?: string
  description?: string
  error?: string
}

export function AvatarUploadField({
  label = 'Profile Picture',
  description = 'Upload a profile picture to personalize your account',
  error,
  ...props
}: AvatarUploadFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <AvatarUpload {...props} />
      
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