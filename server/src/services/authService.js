import prisma from "../config/db.js";
import { createOtp, verifyOtp } from "./otpService.js";
import { generateToken } from "../utils/jwt.js";

// --- 1. LOGIN FLOW ---

// Only existing accounts can request a login OTP
export const requestLoginOtp = async (email) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error("No account found with this email. Please register first.");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  const result = await createOtp(normalizedEmail);
  return result;
};

// Verify OTP for an existing user and return auth token
export const verifyLoginOtp = async (email, code) => {
  if (!email || !code) {
    throw new Error("Email and OTP code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Verify OTP record
  await verifyOtp(normalizedEmail, code.trim());

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error("User record not found");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  // Ensure user marked as verified
  if (!user.isVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: true,
    },
    token,
  };
};

// --- 2. REGISTER FLOW ---

// New users request OTP to verify email ownership before profile creation
export const requestRegisterOtp = async (email) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("An account already exists with this email. Please log in.");
  }

  const result = await createOtp(normalizedEmail);
  return result;
};

// Complete registration: verify OTP and create the user record
export const verifyRegisterOtp = async (name, email, code) => {
  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }
  if (!email || !code) {
    throw new Error("Email and OTP code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Verify OTP
  await verifyOtp(normalizedEmail, code.trim());

  // Check again to avoid duplicate creation
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("User already registered. Please log in.");
  }

  // Create new user in PostgreSQL
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      isVerified: true,
      role: "CUSTOMER",
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
    token,
  };
};

// --- 3. PROFILE / SESSION ---

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  return user;
};