import { errorResponse } from "../utils/response.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access forbidden: requires one of the following roles: ${allowedRoles.join(", ")}`
      );
    }

    next();
  };
};