import { addReview, getPropertyReviews } from "../services/reviewService.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createReview = async (req, res, next) => {
  try {
    const review = await addReview(req.user.id, req.body);
    return successResponse(res, 201, "Review posted successfully", { review });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

export const getReviewsForProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const data = await getPropertyReviews(propertyId);
    return successResponse(res, 200, "Reviews fetched successfully", data);
  } catch (error) {
    return errorResponse(res, 404, error.message);
  }
};