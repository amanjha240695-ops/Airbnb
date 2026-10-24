import { Router } from "express";
import {
  requestOtp,
  verifyOtp,
  requestRegistrationOtp,
  verifyRegistration,
  getMe,
  logout,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// --- Login Endpoints ---
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

// --- Register Endpoints ---
router.post("/register/request-otp", requestRegistrationOtp);
router.post("/register/verify-otp", verifyRegistration);

// --- Session Endpoints ---
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;