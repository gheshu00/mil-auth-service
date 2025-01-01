import express from "express";
import {
  Register,
  Login,
  Logout,
  Validate,
  BanUser,
  UnbanUser,
  regenerateAccessToken,
  AddUser,
} from "../controller/auth"; // Adjust the import path as needed
import { authenticateToken } from "../middleware/authenticate";
import { checkRouteAccess } from "../middleware/protectRoute";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user.
 * @access  Public
 *
 * This route expects a JSON body containing:
 * - `email` (string): The email address of the user.
 * - `password` (string): The password for the user.
 * - `name` (string): The full name of the user.
 */
router.post("/auth/register", Register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user and generate tokens.
 * @access  Public
 *
 * This route expects a JSON body containing:
 * - `email` (string): The email address of the user.
 * - `password` (string): The password for the user.
 */
router.post("/auth/login", Login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user and invalidate their refresh token.
 * @access  Protected (Requires authentication)
 */
router.post("/auth/logout", Logout);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate the user token and return user data or role.
 * @access  Protected (Requires authentication)
 *
 * Optionally, query string `data` can be used to specify whether to return full user data or only the role.
 */
router.get("/auth/validate",authenticateToken, Validate);

/**
 * @route   POST /api/auth/ban
 * @desc    Ban a user for a specified duration.
 * @access  Protected (Requires admin role)
 *
 * This route expects a JSON body containing:
 * - `userId` (string): The ID of the user to ban.
 * - `reason` (string): The reason for banning.
 * - `duration` (string): The duration for which the user will be banned (e.g., "1h", "6h", "7d").
 */
router.post("/auth/ban",authenticateToken, BanUser);

/**
 * @route   POST /api/auth/unban
 * @desc    Unban a user.
 * @access  Protected (Requires admin role)
 *
 * This route expects a JSON body containing:
 * - `userId` (string): The ID of the user to unban.
 */
router.post("/auth/unban", UnbanUser);

/**
 * @route   POST /api/auth/regenerate-token
 * @desc    Regenerate an access token using the provided refresh token.
 * @access  Protected (Requires authentication)
 *
 * This route expects a JSON body containing:
 * - `refreshToken` (string): The refresh token to use for generating a new access token.
 */
router.post("/auth/regenerate-token", regenerateAccessToken);


/**
 * @route   POST /api/users/add
 * @desc    Add a new user to the system.
 * @access  Protected (Requires authentication)
 *
 * This route expects a JSON body containing:
 * - `email` (string): The email address of the user.
 * - `password` (string): The password for the user (will be hashed).
 * - `name` (string): The full name of the user.
 * - `role` (string, optional): The role of the user (defaults to "customer" if not provided).
 *
 * This route will:
 * - Check if the email is already taken.
 * - Hash the password for storage.
 * - Create the new user with the provided details and a default `isVerified` status of `false`.
 * 
 * On success, it returns:
 * - Status code 201
 * - A success message with the newly created user object.
 * 
 * On failure, it returns an error message with status code 400 if the email is already taken or if required fields are missing.
 */
router.post("/users/add",authenticateToken,checkRouteAccess("AddUser"), AddUser);

export default router;