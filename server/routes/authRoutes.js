import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler, httpError } from "../utils/access.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register  — public sign-up for students and teachers only.
// Administrators are created by an existing admin, never through this route.
const SELF_SERVICE_ROLES = ["student", "teacher"];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, role } = req.body || {};

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").toLowerCase().trim();
    const cleanRole = String(role || "student").toLowerCase().trim();
    const cleanPassword = password === undefined || password === null ? "" : String(password);
    const confirm =
      confirmPassword === undefined || confirmPassword === null ? "" : String(confirmPassword);

    if (!cleanName) throw httpError(400, "Full name is required");
    if (cleanName.length < 2) throw httpError(400, "Full name looks too short");
    if (!cleanEmail) throw httpError(400, "Email address is required");
    if (!EMAIL_RX.test(cleanEmail)) throw httpError(400, "Enter a valid email address");
    if (cleanPassword.length < 6) throw httpError(400, "Password must be at least 6 characters");
    if (confirm && confirm !== cleanPassword) throw httpError(400, "Passwords do not match");
    if (!SELF_SERVICE_ROLES.includes(cleanRole)) {
      throw httpError(403, "Administrator accounts cannot be created through sign-up");
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) throw httpError(409, "An account with this email already exists");

    let user;
    try {
      // The User model hashes the password in its pre-save hook.
      user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: cleanRole,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        throw httpError(409, "An account with this email already exists");
      }
      if (err && err.name === "ValidationError") {
        throw httpError(400, Object.values(err.errors)[0]?.message || "Invalid registration details");
      }
      throw err;
    }

    res.status(201).json({
      message: "Account created. You can now sign in.",
      user: user.toJSON(),
    });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw httpError(400, "Email and password are required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(password))) {
      throw httpError(401, "Incorrect email or password");
    }
    if (!user.active) throw httpError(403, "This account has been deactivated");

    const safe = user.toJSON();
    res.json({ token: signToken(safe), user: safe });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

// PUT /api/auth/profile  { name?, currentPassword?, newPassword? }
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const { name, currentPassword, newPassword } = req.body || {};
    const user = await User.findById(req.user._id).select("+password");

    if (name) user.name = name;

    if (newPassword) {
      if (!currentPassword || !(await user.matchPassword(currentPassword))) {
        throw httpError(400, "Current password is incorrect");
      }
      if (newPassword.length < 6) throw httpError(400, "New password is too short");
      user.password = newPassword;
    }

    await user.save();
    res.json({ user: user.toJSON() });
  })
);

export default router;
