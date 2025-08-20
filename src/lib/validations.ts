import { z } from 'zod'

// User Profile Validation
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z
    .string()
    .max(160, 'Bio must be at most 160 characters')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  profile_visibility: z.enum(['public', 'private'])
})

// Post Validation
export const postSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(280, 'Post content must be at most 280 characters'),
  category: z.enum(['general', 'announcement', 'question']),
  image_url: z.string().url().optional().or(z.literal(''))
})

// Comment Validation
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(200, 'Comment content must be at most 200 characters')
})

// Authentication Validation
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Validation Schema Types
export type ValidationSchema = 
  | typeof profileSchema 
  | typeof postSchema 
  | typeof loginSchema 
  | typeof registerSchema 
  | typeof resetPasswordSchema 
  | typeof changePasswordSchema

export type ValidationError = z.ZodError<any>

export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: ValidationError
}

// File Upload Validation
export const imageFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'File size must be less than 2MB')
    .refine(
      (file) => ['image/jpeg', 'image/png'].includes(file.type),
      'Only JPEG and PNG files are allowed'
    )
})

