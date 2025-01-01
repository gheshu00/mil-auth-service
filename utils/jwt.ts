import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

// Function to generate Access Token
export const generateAccessToken = async (userId: string, role: string) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error("JWT_SECRET must be defined");
  }

  const accessToken = await new SignJWT({ id: userId, role: role })  // Include role in the payload
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("24h")  // Access token expires in 24 hours
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

// Function to decrypt or verify the Access Token
export const verifyToken = async (token: string) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error("JWT_SECRET must be defined");
  }

  try {
    // Verify and decode the JWT
    const { payload } = await jwtVerify(token, secret);

    // Return the decoded payload (you can modify this based on what you need)
    return payload;
  } catch (error) {
    // If the token is invalid or expired, throw an error
    throw new Error("Invalid or expired access token");
  }
};