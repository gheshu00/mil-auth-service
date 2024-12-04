import { jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";

// Define your JWT secret or public key
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Utility function to handle sending uniform responses
const sendResponse = (
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data?: any
) => {
  res.status(status).json({ success, message, data });
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(res, 401, false, "Missing or invalid token");
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET) // Convert secret to Uint8Array
    );

    // Calculate remaining expiration time
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const exp = payload.exp as number; // Ensure `exp` exists in the payload
    const remainingTime = exp - currentTime;

    if (remainingTime <= 0) {
      return sendResponse(res, 401, false, "Token has expired", {
        error: "token_expired",
        signOut: true,
      });
    }

    // Attach data to the request object
    req.tokenPayload = payload; // The decoded payload
    req.token = token; // The raw token
    req.tokenRemainingTime = remainingTime; // Remaining time in seconds

    next(); // Pass control to the next middleware/handler
  } catch (err: any) {
    console.error("Token verification failed:", err.message);
    return sendResponse(res, 401, false, "Invalid token", { sys_error: true });
  }
};

// Extend Express Request to include token-related properties
declare global {
  namespace Express {
    interface Request {
      tokenPayload?: Record<string, any>; // Payload from the JWT
      token?: string; // The raw token
      tokenRemainingTime?: number; // Remaining time in seconds
    }
  }
}