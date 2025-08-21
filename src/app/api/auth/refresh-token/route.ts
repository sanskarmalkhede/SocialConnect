import { NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/auth/auth-helpers';
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler';

export async function POST(_request: NextRequest) {
  try {
    const session = await refreshSession();

    if (!session) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Failed to refresh session',
          code: 'SESSION_REFRESH_FAILED',
        }),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createAPIResponse({
        message: 'Session refreshed successfully',
        session,
      }),
      { status: 200 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
