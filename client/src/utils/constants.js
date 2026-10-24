export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  HOST: "HOST",
  ADMIN: "ADMIN",
};

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "CABIN",
  "HOTEL",
  "OTHER",
];