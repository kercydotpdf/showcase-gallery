import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import * as assignments from "../controllers/assignmentController.js";
import * as submissions from "../controllers/submissionController.js";
import * as quizzes from "../controllers/quizController.js";
import * as grades from "../controllers/gradeController.js";

const router = Router();

router.use(protect);

// ---- Assignments -----------------------------------------------------------
router.get("/assignments", assignments.listAssignments);
router.get("/assignments/:id", assignments.getAssignment);
router.get("/assignments/:id/submissions", requireRole("admin", "teacher"), assignments.listAssignmentSubmissions);

router.post("/assignments", requireRole("admin", "teacher"), assignments.createAssignment);
router.put("/assignments/:id", requireRole("admin", "teacher"), assignments.updateAssignment);
router.delete("/assignments/:id", requireRole("admin", "teacher"), assignments.deleteAssignment);
router.post("/assignments/:id/submit", requireRole("student"), assignments.submitAssignment);

// ---- Submissions -----------------------------------------------------------
router.get("/submissions", submissions.listSubmissions);
router.get("/submissions/:id", submissions.getSubmission);
router.put("/submissions/:id/grade", requireRole("admin", "teacher"), submissions.gradeSubmission);

// ---- Quizzes ---------------------------------------------------------------
router.get("/quizzes", quizzes.listQuizzes);
router.get("/quizzes/:id", quizzes.getQuiz);
router.get("/quizzes/:id/attempts", quizzes.listAttempts);
router.post("/quizzes", requireRole("admin", "teacher"), quizzes.createQuiz);
router.put("/quizzes/:id", requireRole("admin", "teacher"), quizzes.updateQuiz);
router.delete("/quizzes/:id", requireRole("admin", "teacher"), quizzes.deleteQuiz);
router.post("/quizzes/:id/attempt", requireRole("student"), quizzes.submitAttempt);

// ---- Grades ----------------------------------------------------------------
router.get("/grades/me", requireRole("student"), grades.myGrades);
router.get("/grades/class/:classId", requireRole("admin", "teacher"), grades.classGradebook);

export default router;
