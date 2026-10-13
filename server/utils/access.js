import Class from "../models/Class.js";

/** Wraps an async route so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Creates an Error carrying an HTTP status code. */
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Loads a class and verifies the current user may see it.
 * Admins see everything, teachers only their own classes,
 * students only classes they are enrolled in.
 */
export async function getClassForUser(classId, user) {
  if (!classId) throw httpError(400, "Class id is required");

  const cls = await Class.findById(classId);
  if (!cls) throw httpError(404, "Class not found");

  if (user.role === "admin") return cls;

  if (user.role === "teacher") {
    if (String(cls.teacher) !== String(user._id)) {
      throw httpError(403, "You are not assigned to this class");
    }
    return cls;
  }

  const enrolled = cls.students.some((s) => String(s) === String(user._id));
  if (!enrolled) throw httpError(403, "You are not enrolled in this class");
  return cls;
}

/** Teacher owns the class, or the user is an admin. */
export async function requireTeacherOfClass(classId, user) {
  const cls = await getClassForUser(classId, user);
  if (user.role === "student") throw httpError(403, "Students cannot change class content");
  return cls;
}

/** True when the student is enrolled in the class. */
export async function requireEnrollment(classId, user) {
  const cls = await getClassForUser(classId, user);
  if (user.role === "student") {
    const enrolled = cls.students.some((s) => String(s) === String(user._id));
    if (!enrolled) throw httpError(403, "You are not enrolled in this class");
  }
  return cls;
}
