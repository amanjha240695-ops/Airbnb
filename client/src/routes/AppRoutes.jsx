import React from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import VerifyOTP from "../pages/VerifyOTP/index";
import Home from "../pages/Home/Home";
import PropertyDetails from "../pages/PropertyDetails/PropertyDetails";
import BookingCheckout from "../pages/BookingCheckout/BookingCheckout";
import BookingStatus from "../pages/BookingStatus/BookingStatus";
import Trips from "../pages/Trips/Trips";
import Profile from "../pages/Profile/Profile";
import HostOnboarding from "../pages/HostOnboarding/HostOnboarding";
import HostDashboard from "../pages/HostDashboard/HostDashboard";
// Temporary placeholder for visual route testing
const Placeholder = ({ title }) => (
  <div className="container page-wrapper">
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        border: "1px dashed var(--border-color)",
        borderRadius: "16px",
        backgroundColor: "var(--bg-light)",
        marginTop: "24px",
      }}
    >
      <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>{title} View</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Component ready for implementation.
      </p>
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Placeholder title="Search & Filters" />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />

      {/* Authenticated Customer Pages */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
  path="/become-host"
  element={
    <ProtectedRoute>
      <HostOnboarding />
    </ProtectedRoute>
  }
/>

      {/* Checkout & Booking Confirmation */}
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <BookingCheckout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/status/:id"
        element={
          <ProtectedRoute>
            <BookingStatus />
          </ProtectedRoute>
        }
      />

      {/* Trips / Bookings Dashboard */}
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        }
      />

      {/* Host Only Dashboard */}
<Route
  path="/host/dashboard"
  element={
    <ProtectedRoute allowedRoles={["HOST", "ADMIN"]}>
      <HostDashboard />
    </ProtectedRoute>
  }
/>


      {/* Admin Moderation Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Placeholder title="Admin Moderation Portal" />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route
        path="*"
        element={
          <div className="container page-wrapper" style={{ textAlign: "center", padding: "64px 0" }}>
            <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>404</h1>
            <p style={{ color: "var(--text-muted)" }}>Page not found.</p>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;