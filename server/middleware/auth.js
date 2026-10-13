import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "This account no longer exists" });
    }
    if (!user.active) {
      return res.status(401).json({ message: "This account has been deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do that" });
    }
    next();
  };
}
