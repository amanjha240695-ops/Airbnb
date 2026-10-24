import { Router } from "express";
import {
  getProfile,
  updateProfile,
  upgradeToHost,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/become-host", upgradeToHost);

export default router;