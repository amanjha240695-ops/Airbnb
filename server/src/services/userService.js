import prisma from "../config/db.js";

export const getUserProfile = async (userId) => {
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
      createdAt: true,
      _count: {
        select: {
          properties: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserProfile = async (userId, updateData) => {
  const { name, phone, avatar } = updateData;

  const dataToUpdate = {};
  if (name !== undefined) dataToUpdate.name = name.trim();
  if (phone !== undefined) dataToUpdate.phone = phone.trim();
  if (avatar !== undefined) dataToUpdate.avatar = avatar.trim();

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const becomeHost = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "HOST") {
    throw new Error("User is already registered as a host");
  }

  if (user.role === "ADMIN") {
    throw new Error("Admin accounts cannot be downgraded to host");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: "HOST" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return updatedUser;
};