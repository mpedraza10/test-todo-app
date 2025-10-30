import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Standard error response structure
export interface ApiError {
  error: string;
  code: number;
  validation?: Array<{
    field: string;
    message: string;
  }>;
}

// Success response helper
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Error response helper
export function errorResponse(message: string, status: number = 500, validation?: ApiError['validation']) {
  const response: ApiError = {
    error: message,
    code: status,
  };

  if (validation) {
    response.validation = validation;
  }

  return NextResponse.json(response, { status });
}

// Handle Zod validation errors
export function handleValidationError(error: ZodError) {
  const validation = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse('Validation failed', 400, validation);
}

// Generic error handler
export function handleError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('not found')) {
      return errorResponse('Resource not found', 404);
    }
    if (error.message.includes('unauthorized') || error.message.includes('No user found')) {
      return errorResponse('Unauthorized access', 401);
    }
    if (error.message.includes('forbidden')) {
      return errorResponse('Access forbidden', 403);
    }

    return errorResponse(error.message, 500);
  }

  return errorResponse('An unexpected error occurred', 500);
}
