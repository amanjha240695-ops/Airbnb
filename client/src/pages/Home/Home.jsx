import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getPropertiesApi } from "../../services/propertyApi";
import PropertyCard from "../../components/property/PropertyCard";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import "./Home.css";

const CATEGORIES = [
  { id: "ALL", label: "All Homes", icon: "🏠" },
  { id: "APARTMENT", label: "Apartments", icon: "🏢" },
  { id: "VILLA", label: "Villas", icon: "🌴" },
  { id: "HOUSE", label: "Houses", icon: "🏡" },
  { id: "ROOM", label: "Rooms", icon: "🛏️" },
  { id: "HOTEL", label: "Hotels", icon: "🏨" },
  { id: "GUESTHOUSE", label: "Guesthouses", icon: "🏡" },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("type") || "ALL"
  );
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const destinationQuery = searchParams.get("destination") || "";
  const checkInQuery = searchParams.get("checkIn") || "";
  const checkOutQuery = searchParams.get("checkOut") || "";
  const guestsQuery = searchParams.get("guests") || "";
  const petsQuery = searchParams.get("pets") === "true";

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (selectedCategory && selectedCategory !== "ALL") {
          params.propertyType = selectedCategory;
        }

        if (destinationQuery) params.destination = destinationQuery;
        if (checkInQuery) params.checkIn = checkInQuery;
        if (checkOutQuery) params.checkOut = checkOutQuery;
        if (guestsQuery) params.guests = guestsQuery;

        const res = await getPropertiesApi(params);
        const listings =
          res?.data?.data?.properties ||
          res?.data?.properties ||
          res?.data?.data ||
          res?.data ||
          [];

        setProperties(Array.isArray(listings) ? listings : []);
      } catch (err) {
        setError(err.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [
    selectedCategory,
    destinationQuery,
    checkInQuery,
    checkOutQuery,
    guestsQuery,
  ]);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (petsQuery) {
      result = result.filter(
        (p) => p.petsAllowed === true || p.allowsPets === true
      );
    }

    return result;
  }, [properties, petsQuery]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);

    const newParams = new URLSearchParams(searchParams);

    // If changing category, clear conflicting destination search
    if (newParams.has("destination")) {
      newParams.delete("destination");
    }

    if (categoryId !== "ALL") {
      newParams.set("type", categoryId);
    } else {
      newParams.delete("type");
    }

    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSelectedCategory("ALL");
  };

  return (
    <div className="home-container">
      {/* Category Filter Carousel */}
      <div className="category-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-item ${
              selectedCategory === cat.id ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="home-loader-wrap">
          <Loader />
        </div>
      ) : error ? (
        <EmptyState title="Couldn't load properties" subtitle={error} />
      ) : filteredProperties.length === 0 ? (
        <div className="no-search-results-wrap">
          <EmptyState
            title={
              selectedCategory !== "ALL"
                ? `No ${selectedCategory.toLowerCase()}s found`
                : destinationQuery
                ? `No stays found in "${destinationQuery}"`
                : "No matching properties found"
            }
            subtitle="Try adjusting your filters or selecting 'All Homes' to discover available stays."
          />
          <button className="clear-search-btn" onClick={handleClearFilters}>
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="properties-grid">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}