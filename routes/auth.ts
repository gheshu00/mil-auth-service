import express from "express";
import { Login, Logout, Register, Validate } from "../controller/auth";
import { getAllRedisData } from "../controller/redist";
import { authenticateToken } from "../middleware/authenticate";
import { validateSchema } from "../middleware";
import { loginSchema, registerSchema } from "../models/zod";

const router = express.Router();

router.post("/login", validateSchema(loginSchema), Login);
router.post("/register", validateSchema(registerSchema), Register);

router.get("/validate", authenticateToken, Validate);
router.get("/logout", authenticateToken, Logout);

// router.get("/redis", getAllRedisData);

export default router;