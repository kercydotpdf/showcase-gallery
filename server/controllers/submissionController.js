import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/submissions?assignmentId=&classId=
export const listSubmissions = asyncHandler(async (req, res) => {
  const { assignmentId, classId } = req.query;

  if (assignmentId) {
    const filter = { assignment: assignmentId };
    if (req.user.role === "student") filter.student = req.user._id;
    const submissions = await Submission.find(filter)
      .populate("student", "name email studentNo")
      .sort({ submittedAt: -1 });
    return res.json(submissions);
  }

  if (!classId) throw httpError(400, "classId or assignmentId is required");
  await getClassForUser(classId, req.user);

  const filter = { class: classId };
  if (req.user.role === "student") filter.student = req.user._id;

  const submissions = await Submission.find(filter)
    .populate("student", "name email studentNo")
    .populate("assignment", "title points dueDate")
    .sort({ submittedAt: -1 });

  res.json(submissions);
});

// GET /api/submissions/:id
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate("student", "name email studentNo")
    .populate("assignment", "title points dueDate instructions");
  if (!submission) throw httpError(404, "Submission not found");

  await getClassForUser(submission.class, req.user);
  if (req.user.role === "student" && String(submission.student._id) !== String(req.user._id)) {
    throw httpError(403, "You can only view your own submission");
  }
  res.json(submission);
});

// PUT /api/submissions/:id/grade   { grade, feedback }
export const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) throw httpError(404, "Submission not found");

  const cls = await getClassForUser(submission.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot grade submissions");
  if (
    req.user.role === "teacher" &&
    String(cls.teacher) !== String(req.user._id)
  ) {
    throw httpError(403, "You are not assigned to this class");
  }

  const { grade, feedback } = req.body || {};
  if (grade === undefined || grade === null || grade === "") {
    throw httpError(400, "A score is required");
  }

  const score = Number(grade);
  if (Number.isNaN(score) || score < 0) throw httpError(400, "Score must be a positive number");

  const assignment = await Assignment.findById(submission.assignment);
  const max = assignment ? assignment.points : 100;
  if (score > max) throw httpError(400, `Score cannot be greater than ${max} points`);

  submission.grade = score;
  submission.feedback = feedback || "";
  submission.status = "graded";
  submission.gradedAt = new Date();
  await submission.save();

  res.json(submission);
});
