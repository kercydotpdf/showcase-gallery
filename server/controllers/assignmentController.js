import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/assignments?classId=
export const listAssignments = asyncHandler(async (req, res) => {
  await getClassForUser(req.query.classId, req.user);
  const assignments = await Assignment.find({ class: req.query.classId }).sort({
    dueDate: 1,
    createdAt: -1,
  });

  if (req.user.role === "student") {
    const mine = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: req.user._id,
    });
    const map = Object.fromEntries(mine.map((s) => [String(s.assignment), s]));
    return res.json(assignments.map((a) => ({ ...a.toObject(), mySubmission: map[a._id] || null })));
  }

  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: assignments.map((a) => a._id) } } },
    { $group: { _id: "$assignment", count: { $sum: 1 } } },
  ]);
  const cmap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json(assignments.map((a) => ({ ...a.toObject(), submissionCount: cmap[a._id] || 0 })));
});

// GET /api/assignments/:id
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, "Assignment not found");
  await getClassForUser(assignment.class, req.user);

  let mySubmission = null;
  if (req.user.role === "student") {
    mySubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });
  }
  res.json({ ...assignment.toObject(), mySubmission });
});

// POST /api/assignments
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, instructions, dueDate, points, classId, attachments } = req.body || {};
  if (!title || !classId) throw httpError(400, "Assignment title and class are required");

  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot create assignments");

  const assignment = await Assignment.create({
    title,
    instructions: instructions || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    points: points === undefined || points === "" ? 100 : Number(points),
    attachments: attachments || [],
    class: classId,
    createdBy: req.user._id,
  });
  res.status(201).json(assignment);
});

// PUT /api/assignments/:id
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, "Assignment not found");
  await getClassForUser(assignment.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot edit assignments");

  const { title, instructions, dueDate, points, attachments } = req.body || {};
  if (title !== undefined) assignment.title = title;
  if (instructions !== undefined) assignment.instructions = instructions;
  if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : null;
  if (points !== undefined) assignment.points = Number(points);
  if (attachments !== undefined) assignment.attachments = attachments;

  await assignment.save();
  res.json(assignment);
});

// DELETE /api/assignments/:id
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, "Assignment not found");
  await getClassForUser(assignment.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete assignments");

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();
  res.json({ message: "Assignment and its submissions deleted" });
});

// GET /api/assignments/:id/submissions  (teacher / admin)
export const listAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, "Assignment not found");
  await getClassForUser(assignment.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Teachers only");

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate("student", "name email studentNo")
    .sort({ submittedAt: 1 });

  // Students who have not submitted yet
  const cls = await getClassForUser(assignment.class, req.user);
  await cls.populate("students", "name email studentNo");
  const submittedIds = new Set(submissions.map((s) => String(s.student._id)));
  const missing = cls.students
    .filter((s) => !submittedIds.has(String(s._id)))
    .map((s) => ({ student: s, notSubmitted: true }));

  res.json({ assignment, submissions, missing });
});

// POST /api/assignments/:id/submit  (student)
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw httpError(404, "Assignment not found");
  const cls = await getClassForUser(assignment.class, req.user);
  if (req.user.role !== "student") throw httpError(403, "Only students can submit work");

  const enrolled = cls.students.some((s) => String(s) === String(req.user._id));
  if (!enrolled) throw httpError(403, "You are not enrolled in this class");

  const { content, file } = req.body || {};
  if (!content && !(file && file.url)) {
    throw httpError(400, "Add some text or attach a file before submitting");
  }
  if (file && file.url && file.url.length > 5 * 1024 * 1024) {
    throw httpError(400, "Attachment is too large. The maximum size is 5 MB.");
  }

  const existing = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  if (existing && existing.status === "graded") {
    throw httpError(400, "Your work has already been graded and can no longer be changed");
  }

  if (existing) {
    existing.content = content || "";
    existing.file = file || { name: "", url: "" };
    existing.submittedAt = new Date();
    await existing.save();
    return res.json(existing);
  }

  const submission = await Submission.create({
    assignment: assignment._id,
    class: assignment.class,
    student: req.user._id,
    content: content || "",
    file: file || { name: "", url: "" },
  });
  res.status(201).json(submission);
});
