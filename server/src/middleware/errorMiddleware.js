import { errorResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return errorResponse(res, statusCode, message);
};