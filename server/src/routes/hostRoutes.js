import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  requestBecomeHost,
  verifyBecomeHost,
  getHostDashboard,
  updateListingPrice,
  togglePublishReview,
  snoozeProperty,
  reactivateProperty,
  permanentlyDelistProperty,
} from "../controllers/hostController.js";

const router = Router();

// Protect all routes inside this host router
router.use(authenticate);

// Onboarding & Dashboard routes
router.post("/request-onboarding", requestBecomeHost);
router.post("/verify-onboarding", verifyBecomeHost);
router.get("/dashboard", getHostDashboard);

// Dynamic Rate/Price and Review moderation routes
router.patch("/properties/:id/price", updateListingPrice);
router.patch("/reviews/:id/publish", togglePublishReview);

// Property Lifecycle: Snooze / Reactivate / Delist
router.patch("/properties/:id/snooze", snoozeProperty);
router.patch("/properties/:id/reactivate", reactivateProperty);
router.post("/properties/:id/delist", permanentlyDelistProperty);

export default router;