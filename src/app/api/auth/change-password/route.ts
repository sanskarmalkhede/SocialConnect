import { NextRequest, NextResponse } from 'next/server';
import { changeUserPassword } from '@/lib/auth/auth-helpers';
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler';
import { changePasswordSchema } from '@/lib/validations';
import { ZodIssue } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createAPIResponse(undefined, {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Change user password
    // Note: The changeUserPassword function in auth-helpers.ts needs to be properly implemented.
    // It currently has a stubbed implementation.
    await changeUserPassword({ currentPassword, newPassword });

    return NextResponse.json(
      createAPIResponse({ message: 'Password changed successfully' }),
      { status: 200 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
