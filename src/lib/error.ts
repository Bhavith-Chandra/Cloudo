export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class CloudProviderError extends AppError {
  constructor(
    message: string,
    public provider: string,
    public operation: string
  ) {
    super(message, 500, 'CLOUD_PROVIDER_ERROR');
    this.name = 'CloudProviderError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public operation: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class CustomError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: any): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error.name === 'ValidationError') {
    return new ValidationError(error.message);
  }

  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  if (error.code === 'P2002') {
    return new ValidationError('Unique constraint violation');
  }

  if (error.code === 'P2025') {
    return new NotFoundError('Record not found');
  }

  return new AppError(error.message || 'An unexpected error occurred');
} 