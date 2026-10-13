import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as modules from "../controllers/moduleController.js";
import * as lessons from "../controllers/lessonController.js";
import * as materials from "../controllers/materialController.js";

const router = Router();

router.use(protect);

// Modules
router.get("/modules", modules.listModules);
router.post("/modules", modules.createModule);
router.put("/modules/:id", modules.updateModule);
router.delete("/modules/:id", modules.deleteModule);

// Lessons
router.get("/lessons", lessons.listLessons);
router.get("/lessons/:id", lessons.getLesson);
router.post("/lessons", lessons.createLesson);
router.put("/lessons/:id", lessons.updateLesson);
router.delete("/lessons/:id", lessons.deleteLesson);

// Materials
router.get("/materials", materials.listMaterials);
router.post("/materials", materials.createMaterial);
router.delete("/materials/:id", materials.deleteMaterial);

export default router;
