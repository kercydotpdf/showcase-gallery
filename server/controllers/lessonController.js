import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/lessons?classId=&moduleId=
export const listLessons = asyncHandler(async (req, res) => {
  const { classId, moduleId } = req.query;
  await getClassForUser(classId, req.user);

  const filter = {};
  if (classId) filter.class = classId;
  if (moduleId) filter.module = moduleId;

  const lessons = await Lesson.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(lessons);
});

// POST /api/lessons
export const createLesson = asyncHandler(async (req, res) => {
  const { title, content, moduleId, classId, order } = req.body || {};
  if (!title || !moduleId || !classId) {
    throw httpError(400, "Lesson title, module and class are required");
  }
  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot create lessons");

  const parent = await Module.findById(moduleId);
  if (!parent || String(parent.class) !== String(classId)) {
    throw httpError(400, "That module does not belong to this class");
  }

  const count = await Lesson.countDocuments({ module: moduleId });
  const lesson = await Lesson.create({
    title,
    content: content || "",
    module: moduleId,
    class: classId,
    order: order ?? count,
  });
  res.status(201).json(lesson);
});

// GET /api/lessons/:id
export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw httpError(404, "Lesson not found");
  await getClassForUser(lesson.class, req.user);
  res.json(lesson);
});

// PUT /api/lessons/:id
export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw httpError(404, "Lesson not found");
  await getClassForUser(lesson.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot edit lessons");

  const { title, content, order } = req.body || {};
  if (title !== undefined) lesson.title = title;
  if (content !== undefined) lesson.content = content;
  if (order !== undefined) lesson.order = order;

  await lesson.save();
  res.json(lesson);
});

// DELETE /api/lessons/:id
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw httpError(404, "Lesson not found");
  await getClassForUser(lesson.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete lessons");

  await lesson.deleteOne();
  res.json({ message: "Lesson deleted" });
});
