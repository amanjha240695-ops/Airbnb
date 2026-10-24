import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 401, "Invalid or expired token.");
  }
};