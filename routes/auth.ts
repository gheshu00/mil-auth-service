import express from "express";
import { Login, Logout, Register, Validate } from "@/controller/auth";
import { getAllRedisData } from "@/controller/redist";
import { authenticateToken } from "@/middleware/authenticate";

const router = express.Router();

router.post("/login", Login as express.RequestHandler);

router.post("/register", Register as express.RequestHandler);

router.get(
  "/validate",
  authenticateToken as express.RequestHandler,
  Validate as express.RequestHandler
);

router.get(
  "/logout",
  authenticateToken as express.RequestHandler,
  Logout as express.RequestHandler
);

router.get("/redis", getAllRedisData as express.RequestHandler);

export default router;
