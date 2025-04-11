import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './db';

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  return user.id;
}

export function handleError(
  res: NextApiResponse,
  error: any,
  message: string = 'An error occurred'
) {
  console.error(message, error);
  res.status(500).json({ error: message });
}

export function validateRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredFields: string[]
): boolean {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return false;
    }
  }
  return true;
}

export function parseDateRange(
  startDate: string | undefined,
  endDate: string | undefined
): { start: Date; end: Date } | null {
  try {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    return { start, end };
  } catch (error) {
    return null;
  }
}

export function formatApiResponse<T>(
  data: T,
  message: string = 'Success'
): { success: boolean; message: string; data: T } {
  return {
    success: true,
    message,
    data,
  };
}

export function formatApiError(
  error: string,
  code: number = 400
): { success: boolean; error: string; code: number } {
  return {
    success: false,
    error,
    code,
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

export function generatePagination(
  page: number,
  limit: number,
  total: number
): {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
} 