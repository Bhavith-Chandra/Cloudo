import { NextApiRequest, NextApiResponse } from 'next';
import { handleError } from './error';
import { logger } from './logger';
import { requireAuth } from './api';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

interface MiddlewareOptions {
  requireAuth?: boolean;
  methods?: string[];
}

export function withMiddleware(
  handler: Handler,
  options: MiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();

    try {
      // Method validation
      if (options.methods && !options.methods.includes(req.method || '')) {
        res.setHeader('Allow', options.methods);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
        return;
      }

      // Authentication
      if (options.requireAuth) {
        const userId = await requireAuth(req, res);
        if (!userId) return;
      }

      // Execute handler
      await handler(req, res);

      // Log request
      const duration = Date.now() - startTime;
      logger.logApiRequest(
        req.method || 'UNKNOWN',
        req.url || 'UNKNOWN',
        res.statusCode,
        duration
      );
    } catch (error) {
      // Handle error
      const appError = handleError(error);
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code,
      });

      // Log error
      const duration = Date.now() - startTime;
      logger.error('API Error', {
        method: req.method,
        url: req.url,
        statusCode: appError.statusCode,
        duration,
        error: appError.message,
      });
    }
  };
}

export function withCors(handler: Handler): Handler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    await handler(req, res);
  };
}

export function withRateLimit(
  handler: Handler,
  options: { limit: number; window: number } = { limit: 100, window: 60 }
): Handler {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `rate-limit:${ip}`;

    const now = Date.now();
    const windowStart = now - options.window * 1000;

    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }

    // Get or initialize request count
    const requestData = requests.get(key) || {
      count: 0,
      resetTime: now + options.window * 1000,
    };

    // Check rate limit
    if (requestData.count >= options.limit) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      });
      return;
    }

    // Update request count
    requestData.count++;
    requests.set(key, requestData);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', options.limit.toString());
    res.setHeader('X-RateLimit-Remaining', (options.limit - requestData.count).toString());
    res.setHeader('X-RateLimit-Reset', requestData.resetTime.toString());

    await handler(req, res);
  };
}

export function withValidation(
  handler: Handler,
  schema: any
): Handler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      await handler(req, res);
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
} 