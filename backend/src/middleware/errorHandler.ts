import { Request, Response, NextFunction } from 'express';
import { sendDatadogEvent } from '../config/datadog';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
  });

  // Send Datadog event for 500 errors
  if (statusCode >= 500) {
    const route = req.route?.path || req.path || 'unknown';
    sendDatadogEvent(
      `500 Error: ${req.method} ${route}`,
      `Error: ${message}\n\nStack: ${err.stack || 'No stack trace'}`,
      'error',
      [
        `method:${req.method}`,
        `route:${route}`,
        `status_code:${statusCode}`,
      ]
    ).catch((eventErr) => {
      console.error('Failed to send Datadog event:', eventErr);
    });
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
