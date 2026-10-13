import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

function totalPoints(quiz) {
  return quiz.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw httpError(400, "Add at least one question");
  }
  questions.forEach((q, i) => {
    if (!q.question || !String(q.question).trim()) {
      throw httpError(400, `Question ${i + 1} needs text`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw httpError(400, `Question ${i + 1} needs at least two options`);
    }
    if (q.options.some((o) => !String(o).trim())) {
      throw httpError(400, `Question ${i + 1} has an empty option`);
    }
    const correct = Number(q.correct);
    if (Number.isNaN(correct) || correct < 0 || correct >= q.options.length) {
      throw httpError(400, `Question ${i + 1} needs a correct answer selected`);
    }
  });
}

// GET /api/quizzes?classId=
export const listQuizzes = asyncHandler(async (req, res) => {
  await getClassForUser(req.query.classId, req.user);
  const quizzes = await Quiz.find({ class: req.query.classId }).sort({ dueDate: 1, createdAt: -1 });

  if (req.user.role !== "student") {
    const attempts = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: quizzes.map((q) => q._id) } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(attempts.map((a) => [String(a._id), a.count]));
    return res.json(
      quizzes.map((q) => ({
        ...q.toObject({ virtuals: false }),
        attemptCount: map[q._id] || 0,
      }))
    );
  }

  const mine = await QuizAttempt.find({
    quiz: { $in: quizzes.map((q) => q._id) },
    student: req.user._id,
  });

  const map = {};
  mine.forEach((a) => {
    (map[String(a.quiz)] ||= []).push(a);
  });

  res.json(
    quizzes.map((q) => ({
      ...q.forStudent(),
      myAttempts: map[q._id] || [],
    }))
  );
});

// GET /api/quizzes/:id
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found");
  await getClassForUser(quiz.class, req.user);

  if (req.user.role === "student") {
    const attempts = await QuizAttempt.find({ quiz: quiz._id, student: req.user._id });
    const canTake = quiz.allowRetake || attempts.length === 0;
    return res.json({ ...quiz.forStudent(), myAttempts: attempts, canTake });
  }

  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate("student", "name email studentNo")
    .sort({ takenAt: -1 });
  res.json({ ...quiz.toObject({ virtuals: false }), attempts });
});

// POST /api/quizzes
export const createQuiz = asyncHandler(async (req, res) => {
  const { title, instructions, dueDate, questions, allowRetake, showResult, classId } =
    req.body || {};
  if (!title || !classId) throw httpError(400, "Quiz title and class are required");

  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot create quizzes");
  validateQuestions(questions);

  const quiz = await Quiz.create({
    title,
    instructions: instructions || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    questions,
    allowRetake: Boolean(allowRetake),
    showResult: showResult === undefined ? true : Boolean(showResult),
    class: classId,
    createdBy: req.user._id,
  });
  res.status(201).json(quiz);
});

// PUT /api/quizzes/:id
export const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found");
  await getClassForUser(quiz.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot edit quizzes");

  const { title, instructions, dueDate, questions, allowRetake, showResult } = req.body || {};
  if (title !== undefined) quiz.title = title;
  if (instructions !== undefined) quiz.instructions = instructions;
  if (dueDate !== undefined) quiz.dueDate = dueDate ? new Date(dueDate) : null;
  if (allowRetake !== undefined) quiz.allowRetake = Boolean(allowRetake);
  if (showResult !== undefined) quiz.showResult = Boolean(showResult);
  if (questions !== undefined) {
    validateQuestions(questions);
    quiz.questions = questions;
  }

  await quiz.save();
  res.json(quiz);
});

// DELETE /api/quizzes/:id
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found");
  await getClassForUser(quiz.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete quizzes");

  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();
  res.json({ message: "Quiz and its attempts deleted" });
});

// POST /api/quizzes/:id/attempt   { answers: [number|null] }
export const submitAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found");

  const cls = await getClassForUser(quiz.class, req.user);
  if (req.user.role !== "student") throw httpError(403, "Only students can take quizzes");

  const enrolled = cls.students.some((s) => String(s) === String(req.user._id));
  if (!enrolled) throw httpError(403, "You are not enrolled in this class");

  const previous = await QuizAttempt.find({ quiz: quiz._id, student: req.user._id });
  if (previous.length > 0 && !quiz.allowRetake) {
    throw httpError(400, "You have already taken this quiz");
  }

  const { answers } = req.body || {};
  if (!Array.isArray(answers)) throw httpError(400, "Answers are missing");
  if (answers.length !== quiz.questions.length) {
    throw httpError(400, "Please answer every question");
  }

  let score = 0;
  const total = totalPoints(quiz);
  const normalized = quiz.questions.map((q, i) => {
    const picked = answers[i];
    if (picked === null || picked === undefined || picked === "") return null;
    const idx = Number(picked);
    if (idx === Number(q.correct)) score += Number(q.points) || 1;
    return idx;
  });

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    class: quiz.class,
    student: req.user._id,
    answers: normalized,
    score,
    total,
    attempt: previous.length + 1,
  });

  // Students only see their own score when the teacher allows it.
  const showResult = quiz.showResult;
  res.status(201).json({
    attempt: showResult ? attempt : { _id: attempt._id, attempt: attempt.attempt, takenAt: attempt.takenAt },
    showResult,
    message: showResult ? `You scored ${score} / ${total}` : "Your answers were submitted",
  });
});

// GET /api/quizzes/:id/attempts
export const listAttempts = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw httpError(404, "Quiz not found");
  await getClassForUser(quiz.class, req.user);

  const filter = { quiz: quiz._id };
  if (req.user.role === "student") filter.student = req.user._id;

  const attempts = await QuizAttempt.find(filter)
    .populate("student", "name email studentNo")
    .sort({ takenAt: -1 });

  res.json(attempts);
});
