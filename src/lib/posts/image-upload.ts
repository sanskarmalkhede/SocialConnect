import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

/**
 * Uploads an image file to Supabase Storage
 * @param file The image file to upload
 * @returns The URL of the uploaded image
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `posts/${fileName}`

    // Upload the file to Supabase Storage
    const { data: _data, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error('Failed to upload image: ' + uploadError.message)
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Image upload error:', error)
    throw new Error('Failed to upload image. Please try again.')
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param url The URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const { pathname } = new URL(url)
    const filePath = pathname.split('/').slice(-2).join('/')

    const { error } = await supabase.storage
      .from('public')
      .remove([filePath])

    if (error) {
      throw new Error('Failed to delete image: ' + error.message)
    }
  } catch (error) {
    console.error('Image delete error:', error)
    throw new Error('Failed to delete image. Please try again.')
  }
}
