import { Router } from "express";
import {
  createReview,
  getReviewsForProperty,
} from "../controllers/reviewController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Public: Anyone can see ratings and comments on a property
router.get("/property/:propertyId", getReviewsForProperty);

// Protected: Only logged-in customers can submit a review
router.post("/", authenticate, createReview);

export default router;