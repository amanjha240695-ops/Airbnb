import prisma from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";

// GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            properties: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 404, "User profile not found");
    }

    return successResponse(res, 200, "Profile retrieved successfully", { user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve profile");
  }
};

// PATCH /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, avatar } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (avatar !== undefined) dataToUpdate.avatar = avatar;

    if (Object.keys(dataToUpdate).length === 0) {
      return errorResponse(res, 400, "No fields provided to update");
    }

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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            properties: true,
          },
        },
      },
    });

    return successResponse(res, 200, "Profile updated successfully", { user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return errorResponse(res, 500, error.message || "Failed to update profile");
  }
};

// POST /api/users/become-host
export const upgradeToHost = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      return errorResponse(res, 404, "User not found");
    }

    if (existingUser.role === "HOST") {
      return errorResponse(res, 400, "User is already registered as a host");
    }

    const upgradedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "HOST" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            properties: true,
          },
        },
      },
    });

    return successResponse(res, 200, "Successfully upgraded to host account", {
      user: upgradedUser,
    });
  } catch (error) {
    console.error("Upgrade to Host Error:", error);
    return errorResponse(res, 500, error.message || "Failed to upgrade account to host");
  }
};