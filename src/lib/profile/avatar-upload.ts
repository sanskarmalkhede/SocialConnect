import { supabase } from '@/lib/supabase/client'
import { FILE_LIMITS, STORAGE_BUCKETS } from '@/constants'
import { ValidationError } from '@/lib/errors'

/**
 * Validate image file for avatar upload
 */
export function validateAvatarFile(file: File): void {
  // Check file size
  if (file.size > FILE_LIMITS.MAX_SIZE) {
    throw new ValidationError('File size must be less than 2MB')
  }

  // Check file type
  if (!FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError('Only JPEG and PNG files are allowed')
  }
}

/**
 * Generate unique filename for avatar
 */
export function generateAvatarFilename(userId: string, file: File): string {
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  return `${userId}/${timestamp}.${extension}`
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Validate file
    validateAvatarFile(file)

    // Generate unique filename
    const filename = generateAvatarFilename(userId, file)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file if it exists
      })

    if (error) {
      console.error('Avatar upload error:', error)
      throw new Error('Failed to upload avatar')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload avatar error:', error)
    throw error
  }
}

/**
 * Delete old avatar from storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === STORAGE_BUCKETS.AVATARS)
    
    if (bucketIndex === -1) {
      console.warn('Invalid avatar URL format:', avatarUrl)
      return
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .remove([filePath])

    if (error) {
      console.error('Delete avatar error:', error)
      // Don't throw error for deletion failures as it's not critical
    }
  } catch (error) {
    console.error('Delete avatar error:', error)
    // Don't throw error for deletion failures as it's not critical
  }
}

/**
 * Update user avatar (upload new and delete old)
 */
export async function updateUserAvatar(userId: string, file: File, oldAvatarUrl?: string): Promise<string> {
  try {
    // Upload new avatar
    const newAvatarUrl = await uploadAvatar(userId, file)

    // Delete old avatar if it exists
    if (oldAvatarUrl) {
      await deleteAvatar(oldAvatarUrl)
    }

    return newAvatarUrl
  } catch (error) {
    console.error('Update user avatar error:', error)
    throw error
  }
}

/**
 * Get avatar upload progress (for future implementation)
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Upload avatar with progress tracking (future enhancement)
 */
export async function uploadAvatarWithProgress(
  userId: string, 
  file: File,
  _onProgress?: (progress: UploadProgress) => void // Prefixed with _
): Promise<string> {
  // For now, just use the regular upload
  // In the future, this could be enhanced with progress tracking
  return uploadAvatar(userId, file)
}
