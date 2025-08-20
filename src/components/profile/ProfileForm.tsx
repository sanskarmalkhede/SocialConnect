'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { profileSchema } from '@/lib/validations'
import { validateUsernameAvailability } from '@/lib/profile/profile-validation'
import { validateAvatarFile } from '@/lib/profile/avatar-upload'
import { getInitials } from '@/lib/format'
import { PROFILE_VISIBILITY_LABELS, CONTENT_LIMITS } from '@/constants'
import type { Profile } from '@/lib/supabase/types'
import type { ProfileFormData } from '@/types'
import { toast } from 'sonner'

interface ProfileFormProps {
  profile: Profile
  onSubmit: (data: ProfileFormData & { avatar?: File }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function ProfileForm({ profile, onSubmit, onCancel, isLoading = false }: ProfileFormProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      bio: profile.bio || '',
      website: profile.website || '',
      location: profile.location || '',
      profile_visibility: profile.profile_visibility
    }
  })

  const watchedUsername = form.watch('username')

  // Check username availability when it changes
  useEffect(() => {
    const checkUsername = async () => {
      if (watchedUsername === profile.username) return // Same as current username
      if (watchedUsername.length < CONTENT_LIMITS.USERNAME_MIN_LENGTH) return

      setUsernameChecking(true)
      try {
        const validation = await validateUsernameAvailability(watchedUsername, profile.id)
        if (!validation.isAvailable) {
          form.setError('username', { message: validation.error })
        } else {
          form.clearErrors('username')
        }
      } catch (error) {
        
      } finally {
        setUsernameChecking(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [watchedUsername, profile.username, profile.id, form])

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      validateAvatarFile(file)
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file')
      event.target.value = '' // Reset input
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    // Reset file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit({
        ...data,
        avatar: avatarFile || undefined
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const currentAvatarUrl = avatarPreview || profile.avatar_url

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your profile information and settings
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentAvatarUrl || undefined} alt={profile.username} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Avatar
                  </Button>
                  
                  {(avatarFile || profile.avatar_url) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  JPEG or PNG, max 2MB
                </p>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter username"
                        disabled={isLoading}
                        {...field}
                      />
                      {usernameChecking && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    3-30 characters, letters, numbers, and underscores only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                      rows={3}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/{CONTENT_LIMITS.BIO_MAX_LENGTH} characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your personal website or portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City, Country"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Where you&apos;re based
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile Visibility */}
            <FormField
              control={form.control}
              name="profile_visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        {PROFILE_VISIBILITY_LABELS.public} - Anyone can see your profile
                      </SelectItem>
                      <SelectItem value="followers_only">
                        {PROFILE_VISIBILITY_LABELS.followers_only} - Only followers can see your profile
                      </SelectItem>
                      <SelectItem value="private">
                        {PROFILE_VISIBILITY_LABELS.private} - Only you can see your profile
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control who can see your profile information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

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
              disabled={isLoading || usernameChecking}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}