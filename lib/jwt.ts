import { SignJWT } from "jose";

export const generateAccessToken = async (userId: string) => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  if (!secret) {
    throw new Error("JWT_SECRET must be defined");
  }

  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("24h") 
    .sign(secret);

  return token;
};
