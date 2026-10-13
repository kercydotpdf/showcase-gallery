import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import * as subjects from "../controllers/subjectController.js";

const router = Router();

router.use(protect);

router.get("/", subjects.listSubjects);

router.use(requireRole("admin"));
router.post("/", subjects.createSubject);
router.put("/:id", subjects.updateSubject);
router.delete("/:id", subjects.deleteSubject);

export default router;
