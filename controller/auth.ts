import { NextFunction, Request, Response } from "express";
import { createUser, getUserByEmail, getUserById } from "../models/user";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import getRedisClient from "../utils/redis";
import { sendResponse } from "../utils/customRes";
import { banUser, unbanUser } from "../models/ban"; // Importing the ban management functions


const redis = getRedisClient();

// Register User
export const Register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return sendResponse(res, 400, false, "All fields are required.");
    }

    try {
        // Check if email is already taken
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return sendResponse(res, 400, false, "Email is already taken.");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await createUser({
            email,
            password: hashedPassword,
            name,
            role: "customer",  // Default role
            isVerified: false
        });

        // Generate tokens
        const userId = user._id as string;
        const role = user.role;
        const accessToken = await generateAccessToken(userId, role);
        const refreshToken = generateRefreshToken(userId);

        // Store refresh token in Redis
        const refreshKey = `${userId}-refresh`;
        await redis.set(refreshKey, refreshToken, "EX", 30 * 24 * 60 * 60);  // Store for 30 days

        // Send success response with tokens
        sendResponse(res, 201, true, "Registration successful", {
            token: accessToken,
            user
        });

    } catch (error) {
        console.error("Registration error:", error);
        next(error);  // Forward to the error handler
    }
};

// Login User
export const Login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendResponse(res, 400, false, "Email and password are required.");
    }

    try {
        // Check if user exists
        const user = await getUserByEmail(email);
        if (!user) {
            return sendResponse(res, 400, false, "Invalid Email", {type: "email"});
        }

        // Check if the user is banned
        const bannedUser = await redis.get(`${user._id}-banned`);
        if (bannedUser) {
            return sendResponse(res, 403, false, "Your account is banned.");
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return sendResponse(res, 400, false, "Invalid Password.", {type: "password"});
        }

        // Generate tokens
        const userId = user._id as string;
        const role = user.role;
        const accessToken = await generateAccessToken(userId, role);
        const refreshToken = generateRefreshToken(userId);

        // Store refresh token in Redis
        const refreshKey = `${userId}-refresh`;
        await redis.set(refreshKey, refreshToken, "EX", 30 * 24 * 60 * 60);  // Store for 30 days

        // Send success response with tokens
        sendResponse(res, 200, true, "Login successful", {
            token: accessToken,
            user
        });

    } catch (error) {
        console.error("Login error:", error);
        next(error);  // Forward to the error handler
    }
};

// Logout User
export const Logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId; // Extracted userId from the token
        const refreshKey = `${userId}-refresh`;

        // Remove refresh token from Redis
        await redis.del(refreshKey);

        // Send success response
        sendResponse(res, 200, true, "Logged out successfully.");
    } catch (error) {
        console.error("Logout error:", error);
        next(error);  // Forward to the error handler
    }
};

// Validate Token (this can be used for validating token or checking user data)
export const Validate = async (req: Request, res: Response, next: NextFunction) => {
    // console.log("Validate User ID:", req.userId);
    const { data } = req.query;
    const userId = req.userId; // Extracted userId from the token

    // Validate the presence of userId
    if (!userId) {
        return sendResponse(res, 400, false, "User ID is missing from the token.");
    }

    try {
        // Check if the user is blacklisted in Redis
        const redis = getRedisClient();
        const isBlacklisted = await redis.get(`${userId}-banned`);

        if (isBlacklisted) {
            return sendResponse(res, 401, false, "User is blacklisted and cannot access the system.", { logout: true });
        }

        // Fetch user from the database
        const user = await getUserById(userId as string);

        if (!user) {
            return sendResponse(res, 404, false, "User not found.", { logout: true });
        }

        // Prepare the response data based on the `data` query parameter
        const responseData = data ? { user } : { role: user.role };

        // Return the success response
        return sendResponse(res, 200, true, "Token validated", responseData);
    } catch (error) {
        console.error("Validation error:", error);
        return next(error);  // Forward to the error handler
    }
};

// Ban a user (admin only)
export const BanUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, reason, duration } = req.body;

  

    if (!userId || !reason || !duration) {
        sendResponse(res, 400, false, "User ID, reason, and duration are required.");
        return;
    }

    try {
        const expirationMap: { [key: string]: number } = {
            "30s": 30,
            "1h": 1 * 60 * 60,               // 1 hour
            "6h": 6 * 60 * 60,               // 6 hours
            "7d": 7 * 24 * 60 * 60,          // 7 days
            "2w": 14 * 24 * 60 * 60,         // 2 weeks
            "1m": 30 * 24 * 60 * 60,         // 1 month
            "3m": 90 * 24 * 60 * 60,         // 3 months
            "6m": 180 * 24 * 60 * 60,        // 6 months
            "forever": Infinity,             // Forever
        };

        const expiresIn = expirationMap[duration];

        if (expiresIn === undefined) {
            return sendResponse(res, 400, false, "Invalid ban duration.");
        }

        const banEvent = {
            createdAt: new Date(),
            expiresAt: expiresIn === Infinity ? undefined : new Date(Date.now() + expiresIn * 1000),
            reason,
        };

        // Ban the user by adding the ban event to their history
        await banUser({
            userId,
            history: [banEvent],
            expiresAt: banEvent.expiresAt,
        });

        // Store the banned user in Redis with TTL (expires in seconds)
        const redis = getRedisClient();
        if (expiresIn !== Infinity) {
            await redis.set(`${userId}-banned`, "true", "EX", expiresIn);
        } else {
            await redis.set(`${userId}-banned`, "true"); // No expiration for "forever" bans
        }

        sendResponse(res, 200, true, `User banned for ${duration}.`);
    } catch (error) {
        console.error("Ban error:", error);
        next(error);
    }
};
// Unban a user
export const UnbanUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;

    if (!userId) {
        return sendResponse(res, 400, false, "User ID is required.");
    }

    try {
        // Unban the user
        await unbanUser(userId);

        // Remove the user from Redis if the ban was stored there
        await redis.del(`${userId}-banned`);

        sendResponse(res, 200, true, "User unbanned successfully.");
    } catch (error) {
        console.error("Unban error:", error);
        next(error);
    }
};

// Regenerate Access Token
export const regenerateAccessToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return sendResponse(res, 400, false, "Refresh token is required.");
    }

    try {
        const redis = getRedisClient();
        const userId = req.userId; // Extracted userId from the token in middleware
        const userRole = req.role; // Extracted userId from the token in middleware

        // Check if the refresh token exists in Redis
        const storedRefreshToken = await redis.get(`${userId}-refresh`);
        if (storedRefreshToken !== refreshToken) {
            return sendResponse(res, 403, false, "Invalid refresh token.");
        }

        // Regenerate the access token using the new `generateAccessToken` function
        const newAccessToken = await generateAccessToken(userId as string, userRole as string);

        // Send response with the new access token
        sendResponse(res, 200, true, "Access token regenerated.", { token: newAccessToken });
    } catch (error) {
        console.error("Regenerating access token failed:", error);
        next(error); // Forward to the error handler
    }
};

// Add User (Admin Only)
export const AddUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name, role} = req.body;
    const userId = req.userId; // Extracted userId from the token in middleware


    if (!email || !password || !name) {
        return sendResponse(res, 400, false, "Email, password, and name are required.");
    }

    try {
        // Check if email is already taken
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return sendResponse(res, 400, false, "Email is already taken.");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = await createUser({
            email,
            password: hashedPassword,
            name,
            role: role || "customer",  // Default to 'customer' if role is not provided
            isVerified: false, // Default to not verified
        });

        sendResponse(res, 201, true, "User added successfully.", { user: newUser });
    } catch (error) {
        console.error("Add User error:", error);
        next(error); // Forward to the error handler
    }
};

