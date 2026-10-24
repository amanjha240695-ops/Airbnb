import { Router } from "express";
import {
  createNewProperty,
  getAllProperties,
  getSingleProperty,
  getMyListings,
} from "../controllers/propertyController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

// 1. Static routes first
router.get("/", getAllProperties);

// Protected Host route: must be ABOVE /:id so Express doesn't treat 'user' as an ID
router.get(
  "/user/my-listings",
  authenticate,
  authorizeRoles("HOST", "ADMIN"),
  getMyListings
);

router.post(
  "/",
  authenticate,
  authorizeRoles("HOST", "ADMIN"),
  createNewProperty
);

// 2. Dynamic parameter route last
router.get("/:id", getSingleProperty);

export default router;