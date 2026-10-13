import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import * as announcements from "../controllers/announcementController.js";

const router = Router();

router.use(protect);

router.get("/", announcements.listAnnouncements);

router.use(requireRole("admin", "teacher"));
router.post("/", announcements.createAnnouncement);
router.put("/:id", announcements.updateAnnouncement);
router.delete("/:id", announcements.deleteAnnouncement);

export default router;
