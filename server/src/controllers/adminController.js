import {
  getAdminProperties,
  updatePropertyModeration,
  getPlatformStats,
} from "../services/adminService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getAllPropertiesForAdmin = async (req, res, next) => {
  try {
    const data = await getAdminProperties(req.query);
    return successResponse(res, 200, "Admin properties retrieved", data);
  } catch (error) {
    next(error);
  }
};

export const moderateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await updatePropertyModeration(req.user.id, id, req.body);
    return successResponse(res, 200, `Property marked as ${property.status}`, { property });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getPlatformStats();
    return successResponse(res, 200, "Platform statistics retrieved", stats);
  } catch (error) {
    next(error);
  }
};