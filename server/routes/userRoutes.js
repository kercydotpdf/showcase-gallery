import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import * as users from "../controllers/userController.js";

const router = Router();

router.use(protect, requireRole("admin"));

router.get("/", users.listUsers);
router.post("/", users.createUser);
router.get("/:id", users.getUser);
router.put("/:id", users.updateUser);
router.delete("/:id", users.deleteUser);

export default router;
