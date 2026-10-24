import crypto from "crypto";
import prisma from "../config/db.js";
import razorpayInstance from "../config/razorpay.js";

export const createRazorpayOrder = async (userId, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking record not found");
  }

  const amountInPaise = Math.round(parseFloat(booking.totalAmount) * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${booking.id.slice(-10)}`,
  };

  const razorpayOrder = await razorpayInstance.orders.create(options);

  // Link or create payment record as PENDING
  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      userId: booking.userId,
      bookingId,
      amount: booking.totalAmount,
      currency: "INR",
      method: "RAZORPAY",
      status: "PENDING",
      razorpayOrderId: razorpayOrder.id,
    },
    update: {
      razorpayOrderId: razorpayOrder.id,
      status: "PENDING",
    },
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    bookingId: booking.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const verifyPaymentSignature = async (userId, verificationData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = verificationData;

  // 1. Clean Secret Key (removes accidental quotes/spaces from .env)
  const cleanSecret = (process.env.RAZORPAY_KEY_SECRET || "").trim().replace(/^["']|["']$/g, "");

  // 2. Cryptographic Signature Verification
  const expectedSignature = crypto
    .createHmac("sha256", cleanSecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    console.error("Signature Mismatch!", { expectedSignature, razorpaySignature });
    await prisma.payment.updateMany({
      where: { bookingId },
      data: { status: "FAILED" },
    });
    throw new Error("Invalid payment signature");
  }

  // 3. STEP 1: IMMEDIATELY MARK BOOKING AS CONFIRMED (Locks Calendar & Updates Host Dashboard)
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CONFIRMED",
      holdExpiresAt: null,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          images: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // 4. STEP 2: MARK PAYMENT AS PAID
  const updatedPayment = await prisma.payment.upsert({
    where: { bookingId },
    create: {
      userId: updatedBooking.userId,
      bookingId,
      amount: updatedBooking.totalAmount,
      currency: "INR",
      method: "RAZORPAY",
      status: "PAID",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    },
    update: {
      status: "PAID",
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  return {
    booking: updatedBooking,
    payment: updatedPayment,
  };
};