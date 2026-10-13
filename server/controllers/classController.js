import Class from "../models/Class.js";
import User from "../models/User.js";
import Module from "../models/Module.js";
import Assignment from "../models/Assignment.js";
import Announcement from "../models/Announcement.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

const POPULATE = [
  { path: "subject" },
  { path: "teacher", select: "name email department" },
  { path: "students", select: "name email studentNo active" },
];

// GET /api/classes?search=
export const listClasses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "teacher") filter.teacher = req.user._id;
  if (req.user.role === "student") filter.students = req.user._id;

  if (req.query.search) {
    const rx = { $regex: String(req.query.search).trim(), $options: "i" };
    filter.$or = [{ name: rx }, { schedule: rx }];
  }

  const classes = await Class.find(filter)
    .populate(POPULATE)
    .sort({ name: 1 });
  res.json(classes);
});

// GET /api/classes/:id
export const getClass = asyncHandler(async (req, res) => {
  const cls = await getClassForUser(req.params.id, req.user);
  await cls.populate(POPULATE);
  res.json(cls);
});

// POST /api/classes  (admin)
export const createClass = asyncHandler(async (req, res) => {
  const { name, subject, teacher, schedule } = req.body || {};
  if (!name || !subject) throw httpError(400, "Class name and subject are required");

  if (teacher) {
    const t = await User.findById(teacher);
    if (!t || t.role !== "teacher") throw httpError(400, "Selected user is not a teacher");
  }

  const cls = await Class.create({ name, subject, teacher: teacher || null, schedule, students: [] });
  res.status(201).json(await cls.populate(POPULATE));
});

// PUT /api/classes/:id  (admin)
export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw httpError(404, "Class not found");

  const { name, subject, teacher, schedule } = req.body || {};
  if (name !== undefined) cls.name = name;
  if (subject !== undefined) cls.subject = subject;
  if (schedule !== undefined) cls.schedule = schedule;
  if (teacher !== undefined) {
    if (teacher === "" || teacher === null) {
      cls.teacher = null;
    } else {
      const t = await User.findById(teacher);
      if (!t || t.role !== "teacher") throw httpError(400, "Selected user is not a teacher");
      cls.teacher = t._id;
    }
  }

  await cls.save();
  res.json(await cls.populate(POPULATE));
});

// DELETE /api/classes/:id  (admin)
export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw httpError(404, "Class not found");

  await Promise.all([
    Module.deleteMany({ class: cls._id }),
    Assignment.deleteMany({ class: cls._id }),
    Announcement.deleteMany({ class: cls._id }),
  ]);
  await cls.deleteOne();
  res.json({ message: "Class and its class content deleted" });
});

// POST /api/classes/:id/students  { studentId }
export const enrollStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw httpError(404, "Class not found");

  const { studentId } = req.body || {};
  if (!studentId) throw httpError(400, "Student is required");

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") throw httpError(400, "Selected user is not a student");

  if (cls.students.some((s) => String(s) === String(studentId))) {
    throw httpError(400, "That student is already enrolled in this class");
  }

  cls.students.push(student._id);
  await cls.save();
  res.json(await cls.populate(POPULATE));
});

// DELETE /api/classes/:id/students/:studentId
export const unenrollStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw httpError(404, "Class not found");

  cls.students = cls.students.filter((s) => String(s) !== String(req.params.studentId));
  await cls.save();
  res.json(await cls.populate(POPULATE));
});
