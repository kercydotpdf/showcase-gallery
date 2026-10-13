import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/modules?classId=
export const listModules = asyncHandler(async (req, res) => {
  await getClassForUser(req.query.classId, req.user);
  const modules = await Module.find({ class: req.query.classId }).sort({ order: 1, createdAt: 1 });

  const lessons = await Lesson.find({ class: req.query.classId })
    .sort({ order: 1, createdAt: 1 })
    .select("-content");

  const withLessons = modules.map((m) => ({
    ...m.toObject(),
    lessons: lessons.filter((l) => String(l.module) === String(m._id)),
  }));

  res.json(withLessons);
});

// POST /api/modules
export const createModule = asyncHandler(async (req, res) => {
  const { title, description, classId, order } = req.body || {};
  if (!title || !classId) throw httpError(400, "Module title and class are required");
  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot create modules");

  const count = await Module.countDocuments({ class: classId });
  const module = await Module.create({
    title,
    description,
    class: classId,
    order: order ?? count,
  });
  res.status(201).json(module);
});

// PUT /api/modules/:id
export const updateModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw httpError(404, "Module not found");
  await getClassForUser(module.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot edit modules");

  const { title, description, order } = req.body || {};
  if (title !== undefined) module.title = title;
  if (description !== undefined) module.description = description;
  if (order !== undefined) module.order = order;

  await module.save();
  res.json(module);
});

// DELETE /api/modules/:id
export const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) throw httpError(404, "Module not found");
  await getClassForUser(module.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete modules");

  await Lesson.deleteMany({ module: module._id });
  await module.deleteOne();
  res.json({ message: "Module and its lessons deleted" });
});
