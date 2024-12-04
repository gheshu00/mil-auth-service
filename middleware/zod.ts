import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";

export const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body); // Validate and sanitize input
      next(); // Proceed to the next middleware or route handler
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
        });
      } else {
        next(error); // Pass unexpected errors to the default error handler
      }
    }
  };