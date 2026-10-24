export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://airbnb-l12d.onrender.com/api";

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