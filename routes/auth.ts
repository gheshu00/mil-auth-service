import express from "express";
import { Login, Logout, Register, Validate } from "../controller/auth";
import { getAllRedisData } from "../controller/redist";
import { authenticateToken } from "../middleware/authenticate";
import { validateSchema } from "../middleware";
import { loginSchema, registerSchema } from "../models/zod";

const router = express.Router();

const auth = router;

auth.post("/login", validateSchema(loginSchema), Login);
auth.post("/register", validateSchema(registerSchema), Register);

auth.get("/validate", authenticateToken, Validate);
auth.get("/logout", authenticateToken, Logout);

// router.get("/redis", getAllRedisData);

export { auth };
