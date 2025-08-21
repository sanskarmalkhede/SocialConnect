
import { supabase } from '@/lib/supabase/client'
import { handleStorageError } from '@/lib/errors'

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `posts/${fileName}`

  const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file)

  if (uploadError) {
    throw handleStorageError(uploadError)
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(filePath)

  return data.publicUrl
}
