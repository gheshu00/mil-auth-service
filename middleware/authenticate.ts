import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt"; // Import the new token verification function
import { sendResponse } from "../utils/customRes";

// Middleware to verify token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        return sendResponse(res, 401, false, "Authorization token is required or invalid.", {logout: true});
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return sendResponse(res, 401, false, "Authorization token is missing.", {logout: true});
    }

    try {
        const decoded = await verifyToken(token);
        req.userId = decoded.id as string;
        req.role = decoded.role as string
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return sendResponse(res, 403, false, "Invalid or expired token.");
    }
};
