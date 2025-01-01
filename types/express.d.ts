// types/express.d.ts or src/types/express.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // Add userId as an optional property
      role?: string; // Add role as an optional property
    }
  }
}