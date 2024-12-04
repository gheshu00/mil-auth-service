import { SignJWT } from "jose";
import crypto from "crypto";

// Function to generate Access Token
export const generateAccessToken = async (userId: string) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error("JWT_SECRET must be defined");
  }

  const accessToken = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("24h") // Access token expires in 24 hours
    .sign(secret);

  return accessToken;
};

// Function to generate Refresh Token
export const generateRefreshToken = (userId: string) => {
  // Generate a secure random string as refresh token
  const refreshToken = crypto.randomBytes(32).toString("hex");

  // Optionally, store it in Redis or database with userId for verification when refreshing the access token
  return refreshToken;
};
