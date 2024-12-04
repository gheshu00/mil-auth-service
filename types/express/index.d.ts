import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      token?: string;
      tokenPayload?: any;
      tokenRemainingTime?: number;
    }
  }
} 