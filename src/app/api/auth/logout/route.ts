import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth/auth-helpers'
import { handleAPIError, createAPIResponse } from '@/lib/errors'

export async function POST(_request: NextRequest) {
  try {
    await logoutUser()

    return NextResponse.json(
      createAPIResponse({ message: 'Logged out successfully' }),
      { status: 200 }
    )
  } catch (error) {
    return handleAPIError(error)
  }
}
