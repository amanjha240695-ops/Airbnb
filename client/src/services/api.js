import { API_BASE_URL } from "../utils/constants";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("airbnb_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const resData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = resData?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return resData;
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, { method: "POST", body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) =>
    apiRequest(endpoint, { method: "PATCH", body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: "DELETE", ...options }),
};

export default api;