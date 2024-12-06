import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcryptjs";
import redis from "../lib/reddis";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";

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

export const Register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, "User already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    const userId = newUser._id as string;

    // Generate JWT tokens
    const accessToken = await generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token in Redis
    const refreshKey = `${newUser._id}-refresh`;
    await redis.set(refreshKey, refreshToken, "EX", 30 * 24 * 60 * 60);

    // Clear previous login attempts from Redis
    const redisKey = `login_attempts:${email}`;
    await redis.del(redisKey);

    sendResponse(res, 201, true, "Registration successful", {
      accessToken,
      refreshToken,
      user: newUser,
    });
  } catch (e: any) {
    console.error(e);
    sendResponse(res, 500, false, "Registration failed", {
      sys_error: true,
      message: e.message,
    });
  }
};

export const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user: any = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (user.banned) {
      return sendResponse(res, 403, false, "Your account has been banned", {
        action: "Banned",
      });
    }

    // Check login attempts
    const key = `log-${email}`;
    let value = await redis.get(key);

    if (value && parseInt(value, 10) >= 5) {
      return sendResponse(res, 429, false, "Too many login attempts");
    }

    let count = parseInt(value || "0", 10);
    const isPassValid = await bcrypt.compare(password, user.password);

    if (!isPassValid) {
      count += 1;
      await redis.set(key, count.toString(), "EX", 3600); // Optional expiration
      return sendResponse(res, 401, false, "Invalid password");
    }

    // Clear failed attempts on successful login
    await redis.del(key);

    const accessToken = await generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in Redis
    const refreshKey = `${user._id}-refresh`;
    await redis.set(refreshKey, refreshToken, "EX", 30 * 24 * 60 * 60);

    sendResponse(res, 200, true, "Login successful", {
      accessToken,
      refreshToken,
      user,
    });
  } catch (e: any) {
    console.error(e);
    sendResponse(res, 500, false, "Internal server error", { sys_error: true });
  }
};

export const Validate = async (req: Request, res: Response) => {
  try {
    const { exp, id: userId } = req.tokenPayload as { exp: number; id: string };
    const token = req.token;

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist-${token}`);
    if (isBlacklisted) {
      return sendResponse(res, 401, false, "Token is blacklisted", {
        error: "token_blacklisted",
        signOut: true,
      });
    }

    // Check if the token has expired
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      return sendResponse(res, 401, false, "Token expired", {
        error: "token_expired",
        signOut: true,
      });
    }

    // Fetch user data, excluding the password
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized, user not found", {
        error: "no_user",
        signOut: true,
      });
    }

    // Token is valid, respond with user info
    sendResponse(res, 200, true, "Token validated successfully", { user });
  } catch (e: any) {
    console.error(e);
    sendResponse(res, 500, false, "Internal server error", { sys_error: true });
  }
};

export const Logout = async (req: Request, res: Response) => {
  try {
    const { token, tokenRemainingTime } = req;

    if (!token || tokenRemainingTime == null) {
      return sendResponse(res, 400, false, "Unauthorized");
    }

    const key = `blacklist-${token}`;
    await redis.set(key, "blacklisted", "EX", tokenRemainingTime);

    sendResponse(res, 200, true, "Successfully logged out", { signOut: true });
  } catch (e: any) {
    console.error(e);
    sendResponse(res, 500, false, "Internal server error", { sys_error: true });
  }
};

