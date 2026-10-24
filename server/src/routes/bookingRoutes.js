import { Router } from "express";
import {
  makeBooking,
  getMyBookings,
  cancelMyBooking,
  getLockedDates,
} from "../controllers/bookingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes: Guests browsing the listing calendar can view locked dates
// Support both URL patterns to prevent any route mismatch:
router.get("/locked-dates/:propertyId", getLockedDates);
router.get("/:propertyId/locked-dates", getLockedDates);

// All actions below this line require authentication
router.use(authenticate);

router.post("/", makeBooking);
router.get("/my-bookings", getMyBookings);
router.patch("/:id/cancel", cancelMyBooking);

export default router;