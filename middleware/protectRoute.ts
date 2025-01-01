import { Request, Response, NextFunction } from "express";
import getRedisClient from "../utils/redis"; // Ensure you have the correct Redis client import
import { sendResponse } from "../utils/customRes";
import { fetchRoleByName } from "../models/role"; // Fetch role data from the database if not in Redis

export const checkRouteAccess = (routeKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = req.role;

    if (!role) {
      return sendResponse(res, 400, false, "Role is required to access this route.");
    }

    if (role === "admin") {
      return next();
    }

    try {
      const redis = getRedisClient();

      const key = `${role}-backendRoutes`;
      const keyType = await redis.type(key);

      if (keyType !== "set" && keyType !== "none") {
        // Delete the key if it's of the wrong type
        await redis.del(key);
      }

      if (keyType === "none") {
        // Fetch role data from the database
        const roleInfo = await fetchRoleByName(role);
        if (!roleInfo) {
          return sendResponse(res, 403, false, "Role not found.");
        }

        // Populate the Redis set with backend routes
        if (roleInfo.backendRoutes?.length) {
          await redis.sadd(key, ...roleInfo.backendRoutes);
        } else {
          return sendResponse(res, 403, false, "No routes assigned to this role.");
        }
      }

      const hasAccess = await redis.sismember(key, routeKey);

      if (!hasAccess) {
        return sendResponse(res, 403, false, "Not permitted to access this route.");
      }

      next(); // Role has access to the route.
    } catch (error) {
      console.error("Error checking route access:", error);
      sendResponse(res, 500, false, "Internal server error.");
    }
  };
};
