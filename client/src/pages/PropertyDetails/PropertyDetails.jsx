import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPropertyByIdApi } from "../../services/propertyApi";
import { getLockedDatesApi } from "../../services/bookingApi";
import PropertyMap from "../../components/property/PropertyMap";
import PropertyReviews from "../../components/property/PropertyReviews";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import "./PropertyDetails.css";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [lockedDates, setLockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Card State
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [warningMessage, setWarningMessage] = useState("");

  // Month navigation for the custom calendar picker
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Parallel fetch for property details & locked dates
        const [propRes, lockRes] = await Promise.all([
          getPropertyByIdApi(id),
          getLockedDatesApi(id).catch(() => ({ data: { lockedDates: [] } })),
        ]);

        const propData = propRes?.data?.property || propRes?.data || propRes?.property;
        setProperty(propData);

        const locks =
          lockRes?.data?.lockedDates ||
          lockRes?.data?.data?.lockedDates ||
          lockRes?.data ||
          [];
        setLockedDates(Array.isArray(locks) ? locks : []);
      } catch (err) {
        setError(err.message || "Property not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  // Helper: check if a specific calendar date (YYYY-MM-DD) is locked or held
  const getDateLockStatus = (dateStr) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    for (const lock of lockedDates) {
      const start = new Date(lock.checkIn);
      const end = new Date(lock.checkOut);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (target >= start && target < end) {
        return lock.status === "HOLD" ? "HOLD" : "LOCKED";
      }
    }
    return null;
  };

  // Format date helper (YYYY-MM-DD)
  const formatDateISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calendar click handler (BookMyShow style)
  const handleDateSelect = (dateStr) => {
    setWarningMessage("");
    const todayStr = formatDateISO(new Date());

    if (dateStr < todayStr) {
      setWarningMessage("Past dates cannot be selected.");
      return;
    }

    const lockStatus = getDateLockStatus(dateStr);
    if (lockStatus === "LOCKED") {
      setWarningMessage("🔒 This date is already booked. Please choose another date.");
      return;
    }
    if (lockStatus === "HOLD") {
      setWarningMessage("⏳ This date is temporarily locked by another user in checkout. Try again shortly or choose another date.");
      return;
    }

    // Date selection flow: If no checkIn or both are set, start new selection
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut("");
    } else {
      // User is picking check-out
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut("");
        return;
      }

      // Check if any date between checkIn and selected checkOut is locked
      let hasConflict = false;
      const curr = new Date(checkIn);
      const end = new Date(dateStr);

      while (curr < end) {
        const checkStr = formatDateISO(curr);
        if (getDateLockStatus(checkStr)) {
          hasConflict = true;
          break;
        }
        curr.setDate(curr.getDate() + 1);
      }

      if (hasConflict) {
        setWarningMessage("🔒 Selected range contains already booked dates. Please pick an unbroken open slot.");
        return;
      }

      setCheckOut(dateStr);
    }
  };

  // Night calculation
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const price = property ? Number(property.pricePerNight) : 0;
  const cleaningFee = property ? Number(property.cleaningFee || 0) : 0;
  const serviceFee = property ? Number(property.serviceFee || 0) : 0;
  const baseTotal = nights > 0 ? price * nights : 0;
  const totalAmount = baseTotal > 0 ? baseTotal + cleaningFee + serviceFee : 0;

  const avgRating =
    property?.reviews && property.reviews.length > 0
      ? property.reviews.reduce((acc, r) => acc + r.rating, 0) / property.reviews.length
      : 4.9;

  const handleReserve = () => {
    if (!checkIn || !checkOut || nights <= 0) {
      setWarningMessage("Please select valid check-in and check-out dates on the calendar.");
      return;
    }

    navigate(`/booking/${property.id}`, {
      state: {
        checkIn,
        checkOut,
        guests,
        nights,
        totalAmount,
        property,
      },
    });
  };

  if (loading) {
    return (
      <div className="details-loader-wrap">
        <Loader />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="details-container">
        <EmptyState
          title="Listing Not Available"
          subtitle={error || "The property listing could not be found."}
        />
      </div>
    );
  }

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          {
            url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
          },
        ];

  // Helper generator for month calendar grid
  const renderCalendarMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
    const todayStr = formatDateISO(new Date());

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} className="cal-cell empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const cellDateStr = formatDateISO(cellDate);
      const lockStatus = getDateLockStatus(cellDateStr);
      const isPast = cellDateStr < todayStr;
      const isSelected = cellDateStr === checkIn || cellDateStr === checkOut;
      const isInRange = checkIn && checkOut && cellDateStr > checkIn && cellDateStr < checkOut;

      let cellClass = "cal-cell";
      if (isPast) cellClass += " past";
      else if (lockStatus === "LOCKED") cellClass += " locked";
      else if (lockStatus === "HOLD") cellClass += " hold";
      else if (isSelected) cellClass += " selected";
      else if (isInRange) cellClass += " in-range";

      days.push(
        <button
          key={cellDateStr}
          type="button"
          className={cellClass}
          onClick={() => handleDateSelect(cellDateStr)}
        >
          <span className="cal-day-num">{d}</span>
          {lockStatus === "LOCKED" && <span className="cal-lock-badge">🔒</span>}
          {lockStatus === "HOLD" && <span className="cal-lock-badge">⏳</span>}
        </button>
      );
    }

    return (
      <div className="custom-calendar-box">
        <div className="cal-nav">
          <button
            type="button"
            className="cal-arrow-btn"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <span className="cal-month-title">{monthName}</span>
          <button
            type="button"
            className="cal-arrow-btn"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>
        <div className="cal-weekdays">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div className="cal-grid">{days}</div>
        <div className="cal-legend">
          <span className="legend-item"><span className="legend-dot open"></span> Available</span>
          <span className="legend-item"><span className="legend-dot hold"></span> ⏳ Hold</span>
          <span className="legend-item"><span className="legend-dot locked"></span> 🔒 Booked</span>
        </div>
      </div>
    );
  };

  return (
    <div className="details-container">
      {/* Title & Location Header */}
      <div className="details-header">
        <h1 className="details-title">{property.title}</h1>
        <div className="details-subhead">
          <span>★ {avgRating.toFixed(2)}</span>
          <span>·</span>
          <span>{property.reviews?.length || 0} reviews</span>
          <span>·</span>
          <span className="details-address">
            {property.city}, {property.state ? `${property.state}, ` : ""}
            {property.country || "India"}
          </span>
        </div>
      </div>

      {/* Image Gallery Mosaic */}
      <div className="mosaic-grid">
        <div className="mosaic-main">
          <img
            src={images[0]?.url}
            alt={property.title}
            className="mosaic-img"
          />
        </div>
        <div className="mosaic-sub">
          {images.slice(1, 5).map((img, idx) => (
            <img
              key={idx}
              src={img.url}
              alt={`${property.title} ${idx + 1}`}
              className="mosaic-img"
            />
          ))}
        </div>
      </div>

      {/* Main Info Columns */}
      <div className="details-content-grid">
        {/* Left Column: Description, Specs, Amenities */}
        <div className="details-left">
          <div className="host-row">
            <div>
              <h2 className="room-type-title">
                {property.propertyType} hosted by {property.host?.name || "Superhost"}
              </h2>
              <p className="room-meta">
                {property.guests} guests · {property.bedrooms} bedroom
                {property.bedrooms > 1 ? "s" : ""} · {property.beds} bed
                {property.beds > 1 ? "s" : ""} · {property.bathrooms} bath
                {property.bathrooms > 1 ? "s" : ""}
              </p>
            </div>
            {property.host?.avatar && (
              <img
                src={property.host.avatar}
                alt="Host"
                className="host-avatar"
              />
            )}
          </div>

          <hr className="divider" />

          <div className="section-block">
            <h3 className="section-heading">About this space</h3>
            <p className="property-desc">{property.description}</p>
          </div>

          <hr className="divider" />

          <div className="section-block">
            <h3 className="section-heading">What this place offers</h3>
            <div className="amenities-grid">
              <div className="amenity-item">📶 High-speed WiFi</div>
              <div className="amenity-item">❄️ Air conditioning</div>
              <div className="amenity-item">🍳 Dedicated kitchen</div>
              <div className="amenity-item">🚗 Free parking on premises</div>
              <div className="amenity-item">📺 55" 4K Smart TV</div>
              <div className="amenity-item">🏊 Private pool or plunge pool</div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Booking Card */}
        <div className="details-right">
          <div className="booking-card">
            <div className="booking-card-header">
              <div>
                <span className="booking-card-price">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="booking-card-unit"> night</span>
              </div>
              <span className="booking-card-rating">★ {avgRating.toFixed(2)}</span>
            </div>

            {/* Warning / Locked Date Message Banner */}
            {warningMessage && (
              <div className="booking-lock-alert">
                <span>{warningMessage}</span>
              </div>
            )}

            {/* Custom Interactive Calendar */}
            {renderCalendarMonth()}

            {/* Selected Date Summary & Guests */}
            <div className="booking-picker-box">
              <div className="picker-dates">
                <div className="picker-field">
                  <label>CHECK-IN</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Select on calendar"
                    value={checkIn || ""}
                  />
                </div>
                <div className="picker-field">
                  <label>CHECKOUT</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Select on calendar"
                    value={checkOut || ""}
                  />
                </div>
              </div>
              <div className="picker-guests">
                <label>GUESTS</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                >
                  {Array.from({ length: property.guests || 4 }, (_, i) => i + 1).map(
                    (num) => (
                      <option key={num} value={num}>
                        {num} guest{num > 1 ? "s" : ""}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={handleReserve}>
              Reserve
            </Button>
            <p className="no-charge-note">You won't be charged yet</p>

            {nights > 0 && (
              <div className="price-breakdown">
                <div className="price-row">
                  <span>
                    ₹{price.toLocaleString("en-IN")} × {nights} nights
                  </span>
                  <span>₹{baseTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="price-row">
                  <span>Cleaning fee</span>
                  <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="price-row">
                  <span>Airbnb clone service fee</span>
                  <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                </div>
                <hr className="divider" />
                <div className="price-row total-row">
                  <span>Total before taxes</span>
                  <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Where you'll be - Map Section */}
      <div className="section-block">
        <h3 className="section-heading">Where you'll be</h3>
        <p
          style={{
            fontSize: "15px",
            color: "#222222",
            marginBottom: "16px",
            fontWeight: "500",
          }}
        >
          {property.city ? `${property.city}, ` : ""}
          {property.state ? `${property.state}, ` : ""}
          {property.country || "India"}
        </p>
        <PropertyMap
          latitude={property.latitude}
          longitude={property.longitude}
          title={property.title}
          city={property.city}
          country={property.country}
        />
      </div>

      <hr className="divider" />

      {/* Guest Reviews Section */}
      <PropertyReviews
        reviews={property.reviews}
        avgRating={avgRating}
      />
    </div>
  );
}