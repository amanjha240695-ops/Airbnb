import api from "./api";

// --- Login Endpoints ---
export const requestOtpApi = async (email) => {
  const response = await api.post("/auth/request-otp", { email });
  return response.data;
};

export const verifyOtpApi = async (email, code) => {
  const response = await api.post("/auth/verify-otp", { email, code });
  return response.data;
};

// --- Register Endpoints ---
export const requestRegisterOtpApi = async (email) => {
  const response = await api.post("/auth/register/request-otp", { email });
  return response.data;
};

export const verifyRegisterOtpApi = async (name, email, code) => {
  const response = await api.post("/auth/register/verify-otp", {
    name,
    email,
    code,
  });
  return response.data;
};

// --- Session Endpoints ---
export const getMeApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};