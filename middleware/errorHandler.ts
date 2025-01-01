// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { CustomError } from '../utils/customError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${err.message}`);

  let statusCode = 500; // Default to Internal Server Error
  let message = 'Something went wrong';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400; // Bad Request
    message = 'Validation Error';
    res.status(statusCode).json({
      success: false,
      error: message,
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return 
  }

  // Handle custom errors
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Include stack trace in development
  });
};