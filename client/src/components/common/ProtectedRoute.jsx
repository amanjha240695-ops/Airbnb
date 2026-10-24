import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, user, loading } = useAuth();
  const location = useLocation();

  // Read direct stored fallback in case AuthContext role hasn't re-synced yet
  const storedUser = JSON.parse(localStorage.getItem("airbnb_user") || "null");
  const storedToken =
    localStorage.getItem("airbnb_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  const effectiveAuth = isAuthenticated || !!storedToken;
  const effectiveRole = role || user?.role || storedUser?.role || "CUSTOMER";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          color: "var(--text-muted)",
          fontSize: "15px",
        }}
      >
        Verifying session...
      </div>
    );
  }

  if (!effectiveAuth) {
    // Preserve intended target URL so we can redirect back after OTP login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;