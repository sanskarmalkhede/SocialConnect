import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/auth/auth-helpers';
import { handleAPIError, createAPIResponse } from '@/lib/api/error-handler';
import { resetPasswordSchema } from '@/lib/validations';
import { ZodIssue } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { email } = validationResult.data;

    // Send password reset email
    await sendPasswordResetEmail(email);

    return NextResponse.json(
      createAPIResponse({ message: 'Password reset email sent successfully' }),
      { status: 200 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
