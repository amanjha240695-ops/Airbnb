import { Router } from "express";
import {
  getAllPropertiesForAdmin,
  moderateProperty,
  getStats,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

// Guard all admin routes: must be logged in AND have ADMIN role
router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/stats", getStats);
router.get("/properties", getAllPropertiesForAdmin);
router.patch("/properties/:id/status", moderateProperty);

export default router;