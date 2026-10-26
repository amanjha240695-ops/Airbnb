import {
  requestLoginOtp,
  verifyLoginOtp,
  requestRegisterOtp,
  verifyRegisterOtp,
  getCurrentUser,
} from "../services/authService.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendOtpEmail } from "../services/emailService.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- LOGIN HANDLERS ---

export const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 400, "Email is required");
    }

    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 400, "Please provide a valid email address");
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await requestLoginOtp(cleanEmail);

    const otpCode = result.code || result.otp;
    if (otpCode) {
      // Non-blocking dispatch taaki network timeout frontend ko crash/hang na kare
      sendOtpEmail(cleanEmail, otpCode).catch((err) => {
        console.warn("[Background Mail Warning]:", err.message);
      });
    }

    return successResponse(res, 200, "OTP sent successfully", {
      email: cleanEmail,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return errorResponse(res, 400, "Email and OTP code are required");
    }

    if (code.trim().length !== 4) {
      return errorResponse(res, 400, "OTP must be a 4-digit code");
    }

    const cleanEmail = email.trim().toLowerCase();
    const authData = await verifyLoginOtp(cleanEmail, code.trim());

    return successResponse(res, 200, "Authentication successful", authData);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// --- REGISTER HANDLERS ---

export const requestRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return errorResponse(res, 400, "Email is required");
    }

    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 400, "Please provide a valid email address");
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await requestRegisterOtp(cleanEmail);

    const otpCode = result.code || result.otp;
    if (otpCode) {
      // Non-blocking dispatch
      sendOtpEmail(cleanEmail, otpCode).catch((err) => {
        console.warn("[Background Mail Warning]:", err.message);
      });
    }

    return successResponse(res, 200, "Verification OTP sent successfully", {
      email: cleanEmail,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

export const verifyRegistration = async (req, res, next) => {
  try {
    const { name, email, code } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 400, "Full name is required");
    }

    if (!email || !code) {
      return errorResponse(res, 400, "Email and OTP code are required");
    }

    if (code.trim().length !== 4) {
      return errorResponse(res, 400, "OTP must be a 4-digit code");
    }

    const cleanEmail = email.trim().toLowerCase();
    const authData = await verifyRegisterOtp(name.trim(), cleanEmail, code.trim());

    return successResponse(res, 201, "Registration successful", authData);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// --- SESSION HANDLERS ---

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    return successResponse(res, 200, "User profile retrieved", { user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return successResponse(res, 200, "Logged out successfully");
};