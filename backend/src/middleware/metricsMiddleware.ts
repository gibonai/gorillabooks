import { Request, Response, NextFunction } from 'express';
import { metrics } from '../config/datadog';

/**
 * Middleware to track HTTP request metrics in Datadog
 * Tracks:
 * - Request count by endpoint, method, and status code
 * - Request latency/duration
 * - Status code distribution
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response is sent
  res.end = function (
    ...args: Parameters<typeof res.end>
  ): ReturnType<typeof res.end> {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const route = req.route?.path || req.path || 'unknown';

    // Tags for metric filtering
    const tags = [
      `method:${method}`,
      `route:${route}`,
      `status_code:${statusCode}`,
      `status_class:${Math.floor(statusCode / 100)}xx`,
    ];

    // Increment request counter
    metrics.increment('http.requests', 1, tags);

    // Record request duration
    metrics.timing('http.request.duration', duration, tags);

    // Increment status code specific counter
    if (statusCode >= 500) {
      metrics.increment('http.errors.5xx', 1, tags);
    } else if (statusCode >= 400) {
      metrics.increment('http.errors.4xx', 1, tags);
    } else if (statusCode >= 200 && statusCode < 300) {
      metrics.increment('http.success', 1, tags);
    }

    // Call original end function
    return originalEnd.apply(res, args);
  };

  next();
};
