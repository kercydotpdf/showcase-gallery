import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import { asyncHandler, httpError } from "../utils/access.js";

// GET /api/subjects?search=
export const listSubjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const rx = { $regex: String(req.query.search).trim(), $options: "i" };
    filter.$or = [{ code: rx }, { title: rx }];
  }
  const subjects = await Subject.find(filter).sort({ code: 1 });
  res.json(subjects);
});

// POST /api/subjects
export const createSubject = asyncHandler(async (req, res) => {
  const { code, title, description } = req.body || {};
  if (!code || !title) throw httpError(400, "Subject code and title are required");

  const exists = await Subject.findOne({ code: String(code).toUpperCase().trim() });
  if (exists) throw httpError(400, "That subject code already exists");

  const subject = await Subject.create({ code, title, description });
  res.status(201).json(subject);
});

// PUT /api/subjects/:id
export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw httpError(404, "Subject not found");

  const { code, title, description } = req.body || {};
  if (code !== undefined) {
    const clean = String(code).toUpperCase().trim();
    const taken = await Subject.findOne({ code: clean, _id: { $ne: subject._id } });
    if (taken) throw httpError(400, "That subject code already exists");
    subject.code = clean;
  }
  if (title !== undefined) subject.title = title;
  if (description !== undefined) subject.description = description;

  await subject.save();
  res.json(subject);
});

// DELETE /api/subjects/:id
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw httpError(404, "Subject not found");

  const classes = await Class.countDocuments({ subject: subject._id });
  if (classes > 0) {
    throw httpError(400, `Cannot delete: ${classes} class(es) still use this subject`);
  }

  await subject.deleteOne();
  res.json({ message: "Subject deleted" });
});
