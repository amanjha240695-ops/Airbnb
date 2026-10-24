import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Interceptor: uses the active 'airbnb_token'
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

// GET /api/users/profile
export const getUserProfileApi = async () => {
  return await API.get("/users/profile");
};

// PATCH /api/users/profile (Matches router.patch)
export const updateUserProfileApi = async (data) => {
  return await API.patch("/users/profile", data);
};

// POST /api/users/become-host (Matches router.post)
export const becomeHostApi = async () => {
  return await API.post("/users/become-host");
};

export default API;