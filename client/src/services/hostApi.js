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

export const requestHostOnboardingApi = async (formData) => {
  return await API.post("/host/request-onboarding", formData);
};

export const verifyHostOnboardingApi = async (otpCode) => {
  return await API.post("/host/verify-onboarding", { otpCode });
};

export const resendHostOnboardingOtpApi = async () => {
  return await API.post("/host/resend-onboarding-otp");
};

export const getHostDashboardApi = async () => {
  return await API.get("/host/dashboard");
};

export const updateListingPriceApi = async (propertyId, payload) => {
  return await API.patch(`/host/properties/${propertyId}/price`, payload);
};

export const togglePublishReviewApi = async (reviewId, isPublished) => {
  return await API.patch(`/host/reviews/${reviewId}/publish`, { isPublished });
};

export const snoozePropertyApi = async (propertyId, payload) => {
  return await API.patch(`/host/properties/${propertyId}/snooze`, payload);
};

export const reactivatePropertyApi = async (propertyId) => {
  return await API.patch(`/host/properties/${propertyId}/reactivate`);
};

export const permanentlyDelistPropertyApi = async (propertyId, payload) => {
  return await API.post(`/host/properties/${propertyId}/delist`, payload);
};

export default API;