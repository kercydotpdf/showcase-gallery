import User from "../models/User.js";
import Class from "../models/Class.js";
import { asyncHandler, httpError } from "../utils/access.js";

const ALLOWED_ROLES = ["admin", "teacher", "student"];

// GET /api/users?role=&search=&active=
export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, active } = req.query;
  const filter = {};

  if (role && ALLOWED_ROLES.includes(role)) filter.role = role;
  if (active === "true") filter.active = true;
  if (active === "false") filter.active = false;
  if (search) filter.$or = [
    { name: { $regex: search.trim(), $options: "i" } },
    { email: { $regex: search.trim(), $options: "i" } },
    { studentNo: { $regex: search.trim(), $options: "i" } },
  ];

  const users = await User.find(filter).sort({ name: 1 });
  res.json(users);
});

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, studentNo, department } = req.body || {};

  if (!name || !email || !password) throw httpError(400, "Name, email and password are required");
  if (!ALLOWED_ROLES.includes(role)) throw httpError(400, "Choose a valid role");
  if (String(password).length < 6) throw httpError(400, "Password must be at least 6 characters");

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) throw httpError(400, "An account with this email already exists");

  const user = await User.create({ name, email, password, role, studentNo, department });
  res.status(201).json(user);
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, "User not found");
  res.json(user);
});

// PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("+password");
  if (!user) throw httpError(404, "User not found");

  const { name, email, password, role, studentNo, department, active } = req.body || {};

  if (name !== undefined) user.name = name;
  if (email !== undefined) {
    const clean = String(email).toLowerCase().trim();
    const taken = await User.findOne({ email: clean, _id: { $ne: user._id } });
    if (taken) throw httpError(400, "An account with this email already exists");
    user.email = clean;
  }
  if (role !== undefined) {
    if (!ALLOWED_ROLES.includes(role)) throw httpError(400, "Choose a valid role");
    if (String(user._id) === String(req.user._id) && role !== "admin") {
      throw httpError(400, "You cannot change your own role");
    }
    user.role = role;
  }
  if (studentNo !== undefined) user.studentNo = studentNo;
  if (department !== undefined) user.department = department;
  if (active !== undefined) user.active = Boolean(active);
  if (password) {
    if (String(password).length < 6) throw httpError(400, "Password must be at least 6 characters");
    user.password = password;
  }

  await user.save();
  res.json(user);
});

// DELETE /api/users/:id?hard=true
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, "User not found");

  if (String(user._id) === String(req.user._id)) {
    throw httpError(400, "You cannot delete your own account");
  }

  if (req.query.hard === "true") {
    if (user.role === "teacher") {
      const classes = await Class.countDocuments({ teacher: user._id });
      if (classes > 0) {
        throw httpError(400, "This teacher still owns classes. Reassign them first, or deactivate instead.");
      }
    }
    if (user.role === "student") {
      const classes = await Class.countDocuments({ students: user._id });
      if (classes > 0) {
        throw httpError(400, "This student is still enrolled in classes. Unenroll them first, or deactivate instead.");
      }
    }
    await user.deleteOne();
    return res.json({ message: "Account deleted" });
  }

  user.active = false;
  await user.save();
  res.json({ message: "Account deactivated", user });
});
