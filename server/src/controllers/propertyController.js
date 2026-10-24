import {
  createProperty,
  getProperties,
  getPropertyById,
  getHostProperties,
} from "../services/propertyService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createNewProperty = async (req, res, next) => {
  try {
    const property = await createProperty(req.user.id, req.body);
    return successResponse(res, 201, "Property created successfully", { property });
  } catch (error) {
    next(error);
  }
};

export const getAllProperties = async (req, res, next) => {
  try {
    const data = await getProperties(req.query);
    return successResponse(res, 200, "Properties fetched successfully", data);
  } catch (error) {
    next(error);
  }
};

export const getSingleProperty = async (req, res, next) => {
  try {
    const property = await getPropertyById(req.params.id);
    return successResponse(res, 200, "Property details fetched", { property });
  } catch (error) {
    return errorResponse(res, 404, error.message);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const listings = await getHostProperties(req.user.id);
    return successResponse(res, 200, "Host listings retrieved", { listings });
  } catch (error) {
    next(error);
  }
};