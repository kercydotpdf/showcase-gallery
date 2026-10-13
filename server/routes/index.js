import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import subjectRoutes from "./subjectRoutes.js";
import classRoutes from "./classRoutes.js";
import contentRoutes from "./contentRoutes.js";
import assessmentRoutes from "./assessmentRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import statsRoutes from "./statsRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/subjects", subjectRoutes);
router.use("/classes", classRoutes);
router.use("/stats", statsRoutes);
router.use("/announcements", announcementRoutes);
router.use("/", contentRoutes);
router.use("/", assessmentRoutes);

export default router;
