import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PropertyCard.css";

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pick cover image or first image fallback
  const coverImage =
    property.images?.find((img) => img.isCover)?.url ||
    property.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80";

  // Calculate average rating
  const avgRating =
    property.reviews && property.reviews.length > 0
      ? (
          property.reviews.reduce((acc, r) => acc + r.rating, 0) /
          property.reviews.length
        ).toFixed(2)
      : property.avgRating
      ? Number(property.avgRating).toFixed(2)
      : null;

  // Preserve search dates when clicking into property details
  const handleCardClick = () => {
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const query =
      checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : "";
    navigate(`/property/${property.id}${query}`);
  };

  return (
    <div
      className="property-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="property-image-container">
        <img
          src={coverImage}
          alt={property.title}
          className={`property-image ${property.isDateLocked ? "img-locked" : ""}`}
          loading="lazy"
        />

        {/* Locked / Reserved Availability Badge */}
        {property.isDateLocked && (
          <div className="property-locked-badge">
            Reserved for selected dates
          </div>
        )}

        <button
          className="wishlist-btn"
          aria-label="Save to wishlist"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            role="presentation"
            focusable="false"
            style={{
              display: "block",
              fill: "rgba(0, 0, 0, 0.5)",
              height: "22px",
              width: "22px",
              stroke: "#ffffff",
              strokeWidth: 2,
              overflow: "visible",
            }}
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05A6.98 6.98 0 0 0 9 4a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
          </svg>
        </button>
      </div>

      <div className="property-info">
        <div className="property-header-row">
          <h3 className="property-location">
            {property.city
              ? `${property.city}, ${property.country || "India"}`
              : property.title}
          </h3>
          <span className="property-rating">
            ★ {avgRating || "New"}
          </span>
        </div>

        <p className="property-subtitle">{property.title}</p>
        <p className="property-guests">
          {property.guests} guest{property.guests > 1 ? "s" : ""} ·{" "}
          {property.bedrooms || 1} bed{property.bedrooms > 1 ? "s" : ""}
        </p>

        <div className="property-price-row">
          <span className="property-price">
            ₹{Number(property.pricePerNight).toLocaleString("en-IN")}
          </span>
          <span className="property-night"> night</span>
        </div>
      </div>
    </div>
  );
}