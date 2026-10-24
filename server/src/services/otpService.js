import prisma from "../config/db.js";
import { generateOtp, getOtpExpiry } from "../utils/otp.js";

const MAX_OTP_ATTEMPTS = 5;

export const createOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Invalidate any active, unused OTPs for this email
  await prisma.oTP.updateMany({
    where: {
      email: normalizedEmail,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  const code = generateOtp();
  const expiresAt = getOtpExpiry();

  const otp = await prisma.oTP.create({
    data: {
      email: normalizedEmail,
      code,
      expiresAt,
    },
  });

  return {
    otpId: otp.id,
    email: normalizedEmail,
    code,
    expiresAt,
  };
};

export const verifyOtp = async (email, code) => {
  const normalizedEmail = email.trim().toLowerCase();

  const otp = await prisma.oTP.findFirst({
    where: {
      email: normalizedEmail,
      isUsed: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    throw new Error("OTP not found or already used");
  }

  if (new Date() > otp.expiresAt) {
    await prisma.oTP.update({
      where: {
        id: otp.id,
      },
      data: {
        isUsed: true,
      },
    });

    throw new Error("OTP has expired");
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.oTP.update({
      where: {
        id: otp.id,
      },
      data: {
        isUsed: true,
      },
    });

    throw new Error("Maximum OTP attempts exceeded");
  }

  if (otp.code !== code.trim()) {
    const updatedOtp = await prisma.oTP.update({
      where: {
        id: otp.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    const remainingAttempts = MAX_OTP_ATTEMPTS - updatedOtp.attempts;

    throw new Error(
      remainingAttempts > 0
        ? `Invalid OTP. ${remainingAttempts} attempts remaining`
        : "Maximum OTP attempts exceeded"
    );
  }

  await prisma.oTP.update({
    where: {
      id: otp.id,
    },
    data: {
      isUsed: true,
    },
  });

  return {
    success: true,
    email: normalizedEmail,
  };
};