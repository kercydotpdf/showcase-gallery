import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import Announcement from "../models/Announcement.js";
import { asyncHandler } from "../utils/access.js";

// GET /api/stats   (returns a different payload for each role)
export const getStats = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role === "admin") {
    const [students, teachers, subjects, classes, recentUsers, recentAnnouncements] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher" }),
        Subject.countDocuments(),
        Class.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select("name role createdAt active"),
        Announcement.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title createdAt class")
          .populate("class", "name"),
      ]);

    return res.json({
      role: "admin",
      counts: { students, teachers, subjects, classes },
      recentUsers,
      recentAnnouncements,
    });
  }

  if (user.role === "teacher") {
    const classes = await Class.find({ teacher: user._id }).populate("subject");
    const classIds = classes.map((c) => c._id);

    const [studentCount, pendingGrades, upcoming, announcements] = await Promise.all([
      User.countDocuments({ _id: { $in: classes.flatMap((c) => c.students) } }),
      Submission.countDocuments({ class: { $in: classIds }, status: "submitted" }),
      Assignment.find({ class: { $in: classIds }, dueDate: { $gte: new Date() } })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate("class", "name"),
      Announcement.find({ class: { $in: classIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("class", "name"),
    ]);

    return res.json({
      role: "teacher",
      counts: {
        classes: classes.length,
        students: studentCount,
        pendingGrades,
        assignments: await Assignment.countDocuments({ class: { $in: classIds } }),
        quizzes: await Quiz.countDocuments({ class: { $in: classIds } }),
      },
      classes: classes.map((c) => ({
        _id: c._id,
        name: c.name,
        subject: c.subject ? { code: c.subject.code, title: c.subject.title } : null,
        students: c.students.length,
      })),
      upcoming,
      recentAnnouncements: announcements,
    });
  }

  // student
  const classes = await Class.find({ students: user._id }).populate("subject teacher", "name email");
  const classIds = classes.map((c) => c._id);

  const assignments = await Assignment.find({ class: { $in: classIds } }).select(
    "title points dueDate class"
  );
  const mySubs = await Submission.find({
    assignment: { $in: assignments.map((a) => a._id) },
    student: user._id,
  }).select("assignment grade status submittedAt");

  const submittedIds = new Set(mySubs.map((s) => String(s.assignment)));
  const pending = assignments.filter((a) => !submittedIds.has(String(a._id)));

  const upcoming = assignments
    .filter((a) => a.dueDate && new Date(a.dueDate) >= new Date() && !submittedIds.has(String(a._id)))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const recentGrades = mySubs
    .filter((s) => s.grade !== null)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);

  const announcements = await Announcement.find({ class: { $in: classIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("class", "name")
    .populate("createdBy", "name");

  res.json({
    role: "student",
    counts: {
      classes: classes.length,
      pending: pending.length,
      submitted: mySubs.length,
      graded: mySubs.filter((s) => s.grade !== null).length,
    },
    classes: classes.map((c) => ({
      _id: c._id,
      name: c.name,
      subject: c.subject ? { code: c.subject.code, title: c.subject.title } : null,
      teacher: c.teacher ? c.teacher.name : null,
      students: c.students.length,
    })),
    upcoming,
    pendingAssignments: pending.slice(0, 5),
    recentGrades,
    recentAnnouncements: announcements,
  });
});
