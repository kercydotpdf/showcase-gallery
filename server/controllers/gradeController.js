import Class from "../models/Class.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/grades/me   (student)
export const myGrades = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") throw httpError(403, "Students only");

  const classes = await Class.find({ students: req.user._id }).populate("subject");
  const classIds = classes.map((c) => c._id);

  const assignments = await Assignment.find({ class: { $in: classIds } })
    .select("title points dueDate class");
  const submissions = await Submission.find({
    assignment: { $in: assignments.map((a) => a._id) },
    student: req.user._id,
  });

  const quizzes = await Quiz.find({ class: { $in: classIds } }).select(
    "title questions class showResult"
  );
  const attempts = await QuizAttempt.find({
    quiz: { $in: quizzes.map((q) => q._id) },
    student: req.user._id,
  });

  const subMap = Object.fromEntries(submissions.map((s) => [String(s.assignment), s]));

  const assignmentRows = assignments.map((a) => {
    const s = subMap[String(a._id)];
    return {
      assignment: a,
      className: classNameOf(classes, a.class),
      status: !s ? "not submitted" : s.status,
      grade: s ? s.grade : null,
      feedback: s ? s.feedback : "",
      submittedAt: s ? s.submittedAt : null,
      points: a.points,
      earned: s && s.grade !== null ? s.grade : null,
    };
  });

  const bestByQuiz = {};
  attempts.forEach((a) => {
    const key = String(a.quiz);
    if (!bestByQuiz[key] || a.score > bestByQuiz[key].score) bestByQuiz[key] = a;
  });

  const quizRows = quizzes.map((q) => {
    const a = bestByQuiz[String(q._id)];
    const total = q.questions.reduce((s, x) => s + (Number(x.points) || 1), 0);
    return {
      quiz: { _id: q._id, title: q.title, class: q.class },
      className: classNameOf(classes, q.class),
      status: a ? "completed" : "not taken",
      grade: a ? a.score : null,
      points: total,
      earned: a ? a.score : null,
      takenAt: a ? a.takenAt : null,
    };
  });

  const graded = [...assignmentRows, ...quizRows].filter((r) => r.earned !== null);
  const earned = graded.reduce((s, r) => s + r.earned, 0);
  const possible = graded.reduce((s, r) => s + r.points, 0);

  res.json({
    classes: classes.map((c) => ({ _id: c._id, name: c.name, subject: c.subject })),
    assignmentRows,
    quizRows,
    summary: {
      graded: graded.length,
      total: assignmentRows.length + quizRows.length,
      earned,
      possible,
      percentage: possible ? Math.round((earned / possible) * 100) : null,
    },
  });
});

// GET /api/grades/class/:classId   (teacher / admin)
export const classGradebook = asyncHandler(async (req, res) => {
  const cls = await getClassForUser(req.params.classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Teachers only");
  await cls.populate("students", "name email studentNo");

  const assignments = await Assignment.find({ class: cls._id }).select("title points dueDate");
  const quizzes = await Quiz.find({ class: cls._id }).select("title questions");
  const submissions = await Submission.find({
    class: cls._id,
    assignment: { $in: assignments.map((a) => a._id) },
  }).populate("student", "name");
  const attempts = await QuizAttempt.find({
    class: cls._id,
    quiz: { $in: quizzes.map((q) => q._id) },
  }).populate("student", "name");

  const rows = cls.students.map((student) => {
    const assignmentCells = assignments.map((a) => {
      const s = submissions.find(
        (x) => String(x.student._id) === String(student._id) && String(x.assignment) === String(a._id)
      );
      return {
        assignmentId: a._id,
        grade: s && s.grade !== null ? s.grade : null,
        status: s ? s.status : "not submitted",
        submissionId: s ? s._id : null,
      };
    });

    const quizCells = quizzes.map((q) => {
      const mine = attempts.filter(
        (x) => String(x.student._id) === String(student._id) && String(x.quiz) === String(q._id)
      );
      const best = mine.reduce((max, a) => (max === null || a.score > max.score ? a : max), null);
      return {
        quizId: q._id,
        grade: best ? best.score : null,
        status: mine.length ? "completed" : "not taken",
        attempts: mine.length,
      };
    });

    const earned = [...assignmentCells, ...quizCells].reduce(
      (s, c) => s + (c.grade ?? 0),
      0
    );
    const possible =
      assignments.reduce((s, a) => s + a.points, 0) +
      quizzes.reduce((s, q) => s + q.questions.reduce((t, x) => t + (Number(x.points) || 1), 0), 0);

    return {
      student,
      assignmentCells,
      quizCells,
      earned,
      possible,
      percentage: possible ? Math.round((earned / possible) * 100) : null,
    };
  });

  res.json({
    className: cls.name,
    assignments,
    quizzes: quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      points: q.questions.reduce((s, x) => s + (Number(x.points) || 1), 0),
    })),
    rows,
  });
});

function classNameOf(classes, id) {
  const c = classes.find((x) => String(x._id) === String(id));
  return c ? `${c.subject ? c.subject.code : ""} ${c.name}`.trim() : "";
}
