import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    await logoutUser()

    return NextResponse.json(
      createAPIResponse({ message: 'Logged out successfully' }),
      { status: 200 }
    )
  } catch (error) {
    const errorResponse = handleAPIError(error)
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500 
    })
  }
}