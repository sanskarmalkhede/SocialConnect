import { NextRequest, NextResponse } from 'next/server'
import { changePasswordSchema } from '@/lib/validations'
import { changeUserPassword } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await authenticateRequest(request)

    const body = await request.json()
    
    // Validate request data
    const validationResult = changePasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }),
        { status: 400 }
      )
    }

    // Change password
    await changeUserPassword(validationResult.data)

    return NextResponse.json(
      createAPIResponse({ 
        message: 'Password changed successfully' 
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password API error:', error)
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}