import { NextRequest, NextResponse } from 'next/server'
import { createUserProfileServer } from '@/lib/auth/server-helpers'
import { handleAPIError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const { user, username } = await req.json()
    
    if (!user || !username) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    const profile = await createUserProfileServer(user, username)

    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Internal server error' } },
      { status: 500 }
    )
  }
}
