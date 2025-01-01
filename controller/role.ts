import { NextFunction, Request, Response } from "express";
import { createRole as createRoleInDB, deleteRole as deleteRoleInDB } from "../models/role";
import { getUserById } from "../models/user";
import { sendResponse } from "../utils/customRes";

// Create Role
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId; // Extracted from token by auth middleware
    const { name, backendRoutes, frontendRoutes } = req.body;

    if (!name || !backendRoutes || !frontendRoutes) {
        return sendResponse(res, 400, false, "All fields are required.");
    }

    try {
        // Get the user and verify role
        const user = await getUserById(userId as string);
        if (!user) {
            return sendResponse(res, 404, false, "User not found.");
        }

        if (user.role !== "admin") {
            return sendResponse(res, 403, false, "Unauthorized access.");
        }

        // Create the role in the database
        await createRoleInDB({ name, backendRoutes, frontendRoutes });

        sendResponse(res, 201, true, "Role created successfully.");
    } catch (error) {
        console.error("Create Role Error:", error);
        next(error); // Forward to the error handler
    }
};

// Delete Role
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId; // Extracted from token by auth middleware
    const { roleId } = req.params;

    if (!roleId) {
        return sendResponse(res, 400, false, "Role ID is required.");
    }

    try {
        // Get the user and verify role
        const user = await getUserById(userId as string);
        if (!user) {
            return sendResponse(res, 404, false, "User not found.");
        }

        if (user.role !== "admin") {
            return sendResponse(res, 403, false, "Unauthorized access.");
        }

        // Delete the role from the database
        await deleteRoleInDB(roleId);

        sendResponse(res, 200, true, "Role deleted successfully.");
    } catch (error) {
        console.error("Delete Role Error:", error);
        next(error); // Forward to the error handler
    }
};