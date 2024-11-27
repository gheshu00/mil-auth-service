import { Request, Response } from "express";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import redis from "@/lib/reddis";
import { generateAccessToken } from "@/lib/jwt";


export const Register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
    });

    await newUser.save();

    const token = await generateAccessToken(newUser._id.toString());

    const redisKey = `login_attempts:${email}`;
    await redis.del(redisKey);

    res.json({ success: true, token, user: newUser });
  } catch (e: any) {
    res.status(500).json({ success: false, message: "Registration Failed" });
  }
};

export const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user: any = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: "Your Account has been banned",
        action: "Banned",
      });
    }

    // Redis Key Set Up
    const key = `log-${email}`;
    let value = await redis.get(key);

    // Check if value is not null before parsing
    if (value && parseInt(value, 10) >= 5) {
      return res
        .status(429)
        .json({ success: false, message: "Too many login attempts" });
    }

    let count = parseInt(value || "0", 10);

    const isPassValid = await bcrypt.compare(password, user.password);

    if (!isPassValid) {
      count += 1;
      await redis.set(key, count.toString(), "EX", 3600); // Optional expiration
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }

    // Clear failed attempts on successful login
    await redis.del(key);

    const userId = String(user._id);

    // Generate JWT token
    const token = await generateAccessToken(userId);

    res.status(200).json({ success: true, user, token });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const Validate = async (req: Request, res: Response) => {
  try {
    const token = req.token;
    const { id: userId } = req.tokenPayload as { id: string };
    const payload = req.tokenPayload;

    // console.log({ token: token, payload: payload });

    const key = `blacklist-${token}`;
    const isBlackListed = await redis.get(key);

    if (isBlackListed) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised",
        error: "blacklisted",
      });
    }

    // Fetch User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised",
        error: "no user",
        userId,
      });
    }

    res.status(200).json({ success: true, user });
  } catch (e: any) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const Logout = async (req: Request, res: Response) => {
  try {
    const token = req.token;
    const tokenTime = req.tokenRemainingTime;

    if (!token || tokenTime == null) {
      return res.status(400).json({
        success: false,
        message: "Unauthorised",
      });
    }

    // Blacklist Token in Redis
    const key = `blacklist-${token}`;
    await redis.set(key, "blacklisted", "EX", tokenTime);

    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (e: any) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
