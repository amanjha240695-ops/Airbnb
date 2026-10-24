import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("airbnb_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (token && token !== "null" && token !== "undefined") {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

// Create booking in database
export const createBookingApi = async (bookingData) => {
  return await API.post("/bookings", bookingData);
};

// Create Razorpay Order
export const createPaymentOrderApi = async (bookingId) => {
  return await API.post("/payments/create-order", { bookingId });
};

// Verify Razorpay Payment Signature
export const verifyPaymentApi = async (verificationPayload) => {
  return await API.post("/payments/verify", verificationPayload);
};

// Get Locked Dates
export const getLockedDatesApi = async (propertyId) => {
  return await API.get(`/bookings/locked-dates/${propertyId}`);
};

// Get My Trips / Bookings
export const getMyBookingsApi = async () => {
  return await API.get("/bookings/my-bookings");
};

// Cancel Booking
export const cancelBookingApi = async (bookingId, reason) => {
  return await API.patch(`/bookings/${bookingId}/cancel`, { reason });
};

export default API;