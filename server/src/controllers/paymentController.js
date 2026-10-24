import { createRazorpayOrder, verifyPaymentSignature } from "../services/paymentService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return errorResponse(res, 400, "bookingId is required to generate payment order");
    }

    const orderData = await createRazorpayOrder(req.user?.id, bookingId);
    return successResponse(res, 200, "Razorpay order generated", orderData);
  } catch (error) {
    console.error("createOrder Error:", error);
    return errorResponse(res, 400, error.message || "Failed to generate Razorpay order");
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    console.log("--> Payment Verification Hit. Payload:", req.body);

    const payload = req.body || {};
    const { bookingId, razorpayPaymentId, razorpaySignature } = payload;

    if (!bookingId || !razorpayPaymentId || !razorpaySignature) {
      return errorResponse(res, 400, "bookingId, razorpayPaymentId and razorpaySignature are required");
    }

    // Direct Verification & Instant Database Confirmation
    const result = await verifyPaymentSignature(req.user?.id, payload);

    console.log(`[SUCCESS] Booking ${bookingId} is now CONFIRMED. Calendar locked & Host Dashboard updated.`);

    return successResponse(res, 200, "Payment verified, booking confirmed and calendar locked", result);
  } catch (error) {
    console.error("verifyPayment Error:", error);
    return errorResponse(res, 400, error.message || "Payment verification failed");
  }
};