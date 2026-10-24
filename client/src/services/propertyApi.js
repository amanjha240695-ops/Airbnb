import { api } from "./api";

// Fetch public approved properties with optional query params (propertyType, city, minPrice, maxPrice, search)
export const getPropertiesApi = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  const endpoint = queryString ? `/properties?${queryString}` : "/properties";

  return await api.get(endpoint);
};

// Fetch single property by ID
export const getPropertyByIdApi = async (id) => {
  return await api.get(`/properties/${id}`);
};

// Create a new property listing (Host only)
export const createPropertyApi = async (propertyData) => {
  return await api.post("/properties", propertyData);
};

// Host: Fetch listings owned by logged-in host
export const getHostPropertiesApi = async () => {
  return await api.get("/properties/user/my-listings");
};