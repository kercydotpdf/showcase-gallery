import Announcement from "../models/Announcement.js";
import Class from "../models/Class.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

// GET /api/announcements?classId=   (no classId = every class the user belongs to)
export const listAnnouncements = asyncHandler(async (req, res) => {
  const { classId } = req.query;

  if (classId) {
    await getClassForUser(classId, req.user);
    const list = await Announcement.find({ class: classId })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });
    return res.json(list);
  }

  const filter =
    req.user.role === "teacher"
      ? { teacher: req.user._id }
      : req.user.role === "student"
        ? { students: req.user._id }
        : {};

  const classes = await Class.find(filter).select("_id");
  const list = await Announcement.find({ class: { $in: classes.map((c) => c._id) } })
    .populate("createdBy", "name role")
    .populate({ path: "class", select: "name" })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(list);
});

// POST /api/announcements
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, classId } = req.body || {};
  if (!title || !content || !classId) throw httpError(400, "Title, text and class are required");

  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot post announcements");

  const announcement = await Announcement.create({
    title,
    content,
    class: classId,
    createdBy: req.user._id,
  });
  res.status(201).json(announcement);
});

// PUT /api/announcements/:id
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw httpError(404, "Announcement not found");
  await getClassForUser(announcement.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot edit announcements");

  const { title, content } = req.body || {};
  if (title !== undefined) announcement.title = title;
  if (content !== undefined) announcement.content = content;

  await announcement.save();
  res.json(announcement);
});

// DELETE /api/announcements/:id
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw httpError(404, "Announcement not found");
  await getClassForUser(announcement.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete announcements");

  await announcement.deleteOne();
  res.json({ message: "Announcement deleted" });
});
