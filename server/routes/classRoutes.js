import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import * as classes from "../controllers/classController.js";

const router = Router();

router.use(protect);

router.get("/", classes.listClasses);
router.get("/:id", classes.getClass);

router.use(requireRole("admin"));
router.post("/", classes.createClass);
router.put("/:id", classes.updateClass);
router.delete("/:id", classes.deleteClass);
router.post("/:id/students", classes.enrollStudent);
router.delete("/:id/students/:studentId", classes.unenrollStudent);

export default router;
