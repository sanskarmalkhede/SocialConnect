import { supabase } from '@/lib/supabase/client'
import { FILE_LIMITS, STORAGE_BUCKETS } from '@/constants'
import { ValidationError } from '@/lib/errors'

/**
 * Validate image file for post upload
 */
export function validatePostImageFile(file: File): void {
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
 * Generate unique filename for post image
 */
export function generatePostImageFilename(userId: string, file: File): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()
  return `${userId}/${timestamp}-${randomString}.${extension}`
}

/**
 * Upload post image to Supabase Storage
 */
export async function uploadPostImage(userId: string, file: File): Promise<string> {
  try {
    // Validate file
    validatePostImageFile(file)

    // Generate unique filename
    const filename = generatePostImageFilename(userId, file)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_IMAGES)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false // Don't replace existing files
      })

    if (error) {
      console.error('Post image upload error:', error)
      throw new Error('Failed to upload image')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.POST_IMAGES)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload post image error:', error)
    throw error
  }
}

/**
 * Delete post image from storage
 */
export async function deletePostImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === STORAGE_BUCKETS.POST_IMAGES)
    
    if (bucketIndex === -1) {
      console.warn('Invalid post image URL format:', imageUrl)
      return
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_IMAGES)
      .remove([filePath])

    if (error) {
      console.error('Delete post image error:', error)
      // Don't throw error for deletion failures as it's not critical
    }
  } catch (error) {
    console.error('Delete post image error:', error)
    // Don't throw error for deletion failures as it's not critical
  }
}

/**
 * Upload post image with progress tracking (future enhancement)
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Upload post image with progress tracking (future enhancement)
 */
export async function uploadPostImageWithProgress(
  userId: string, 
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // For now, just use the regular upload
  // In the future, this could be enhanced with progress tracking
  return uploadPostImage(userId, file)
}

/**
 * Resize image before upload (future enhancement)
 */
export async function resizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        0.9 // Quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create image thumbnail (future enhancement)
 */
export async function createThumbnail(file: File, size: number = 300): Promise<File> {
  return resizeImage(file, size, size)
}