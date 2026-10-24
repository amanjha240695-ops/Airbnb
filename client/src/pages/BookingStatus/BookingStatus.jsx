import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "./BookingStatus.css";

export default function BookingStatus() {
  // Support both :id and :bookingId from router params
  const params = useParams();
  const currentBookingId = params.bookingId || params.id;

  const location = useLocation();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState(location.state?.booking || null);
  const [propertyData, setPropertyData] = useState(
    location.state?.booking?.property || location.state?.property || null
  );
  const [paymentId, setPaymentId] = useState(
    location.state?.paymentId || location.state?.booking?.payment?.razorpayPaymentId || null
  );
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState(null);

  // If user navigated directly or refreshed, fetch fresh data from backend
  useEffect(() => {
    if (!bookingData && currentBookingId) {
      const fetchBookingDetails = async () => {
        try {
          setLoading(true);

          let fetchedBooking = null;

          // Attempt 1: Fetch direct single booking by ID
          try {
            const res = await api.get(`/bookings/${currentBookingId}`);
            fetchedBooking =
              res?.data?.data?.booking ||
              res?.data?.booking ||
              res?.data?.data ||
              res?.data;
          } catch {
            // Attempt 2: Fallback to user bookings list if single endpoint differs
            const resList = await api.get("/bookings/my-bookings");
            const bookingsList =
              resList?.data?.data?.bookings ||
              resList?.data?.bookings ||
              [];
            fetchedBooking = bookingsList.find((b) => b.id === currentBookingId);
          }

          if (fetchedBooking) {
            setBookingData(fetchedBooking);
            if (fetchedBooking.property) {
              setPropertyData(fetchedBooking.property);
            }
            if (fetchedBooking.payment?.razorpayPaymentId) {
              setPaymentId(fetchedBooking.payment.razorpayPaymentId);
            }
          } else {
            throw new Error("No booking record found for this ID.");
          }
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Could not load booking details. Please visit My Trips."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchBookingDetails();
    }
  }, [currentBookingId, bookingData]);

  if (loading) {
    return (
      <div className="status-loading-screen">
        <div className="status-spinner"></div>
        <p>Loading your reservation confirmation...</p>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="status-error-container">
        <h2>Unable to display booking</h2>
        <p>{error || "No booking record found for this ID."}</p>
        <button className="status-primary-btn" onClick={() => navigate("/")}>
          Return Home
        </button>
      </div>
    );
  }

  // Formatting dates & values safely
  const checkInFormatted = new Date(bookingData.checkIn).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const checkOutFormatted = new Date(bookingData.checkOut).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const coverImage =
    propertyData?.images?.[0]?.url ||
    propertyData?.images?.[0] ||
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80";

  const hostUser = propertyData?.host || propertyData?.user || {
    name: "Airbnb Host Partner",
    email: "host-support@airbnb.com",
    phone: "+91 98765 43210",
  };

  const guestUser = bookingData?.user || {
    name: "Aman Kumar Jha",
    email: "guest@airbnb.com",
    phone: "+91 98765 43210",
  };

  const pricePerNight = Number(bookingData.pricePerNight || propertyData?.pricePerNight || 0);
  const nights = Number(bookingData.nights || 1);
  const subtotal = pricePerNight * nights;
  const cleaningFee = Number(bookingData.cleaningFee || propertyData?.cleaningFee || 0);
  const serviceFee = Number(bookingData.serviceFee || propertyData?.serviceFee || 0);
  const totalPaid = Number(bookingData.totalAmount || 0);

  return (
    <div className="status-page-wrapper">
      <div className="status-card-main">
        {/* Top Success Header */}
        <div className="status-badge-header">
          <div className="status-checkmark-circle">
            <span className="status-checkmark-icon">✓</span>
          </div>
          <h1>Reservation Confirmed!</h1>
          <p>
            Your payment was processed successfully. A confirmation receipt has been generated.
          </p>

          <div className="status-reference-pills">
            <div className="ref-pill">
              <span>Booking ID:</span> <strong>{currentBookingId}</strong>
            </div>
            {paymentId && (
              <div className="ref-pill">
                <span>Razorpay Txn ID:</span> <strong>{paymentId}</strong>
              </div>
            )}
            <div className="ref-pill status-pill-confirmed">
              <span>Status:</span> <strong>CONFIRMED & PAID</strong>
            </div>
          </div>
        </div>

        <hr className="status-rule" />

        {/* 1. Property Details Overview */}
        <section className="status-section">
          <h2 className="status-sec-title">Property Details</h2>
          <div className="status-property-card">
            <img src={coverImage} alt={propertyData?.title} className="status-prop-img" />
            <div className="status-prop-meta">
              <span className="status-prop-category">
                {propertyData?.propertyType || "Entire Villa / Apartment"}
              </span>
              <h3>{propertyData?.title || "Luxury Stay Listing"}</h3>
              <p className="status-prop-addr">
                📍 {propertyData?.address || "Prime Location"}, {propertyData?.city},{" "}
                {propertyData?.state || "Delhi NCR"}
              </p>
              <div className="status-stay-pills">
                <span>👥 {bookingData.guests || 1} Guests</span>
                <span>🌙 {nights} Night{nights > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Check-In & Check-Out Schedule */}
        <section className="status-section">
          <h2 className="status-sec-title">Stay Dates & Timings</h2>
          <div className="status-dates-box">
            <div className="date-block">
              <span className="block-label">CHECK-IN</span>
              <h4>{checkInFormatted}</h4>
              <p>After 2:00 PM</p>
            </div>
            <div className="date-arrow">➔</div>
            <div className="date-block">
              <span className="block-label">CHECKOUT</span>
              <h4>{checkOutFormatted}</h4>
              <p>Before 11:00 AM</p>
            </div>
          </div>
        </section>

        {/* 3. Contact Details Grid (Guest & Host) */}
        <section className="status-section">
          <h2 className="status-sec-title">Contact & Host Information</h2>
          <div className="status-contacts-grid">
            {/* Guest Info */}
            <div className="contact-box">
              <span className="contact-role">Primary Guest (You)</span>
              <h4>{guestUser.name || "Aman Kumar Jha"}</h4>
              <div className="contact-line">
                <span>📧</span> {guestUser.email || "guest@airbnb.com"}
              </div>
              <div className="contact-line">
                <span>📞</span> {guestUser.phone || "+91 98765 43210"}
              </div>
            </div>

            {/* Host Info */}
            <div className="contact-box host-box">
              <span className="contact-role">Your Host</span>
              <h4>{hostUser.name || "Superhost"}</h4>
              <div className="contact-line">
                <span>📧</span> {hostUser.email || "host-service@airbnb.com"}
              </div>
              <div className="contact-line">
                <span>📞</span> {hostUser.phone || "+91 91234 56789"}
              </div>
              <span className="host-badge">⚡ Typical response time: Within 1 hour</span>
            </div>
          </div>
        </section>

        {/* 4. Payment Summary */}
        <section className="status-section">
          <h2 className="status-sec-title">Payment Summary</h2>
          <div className="status-pricing-box">
            <div className="price-line">
              <span>
                ₹{pricePerNight.toLocaleString("en-IN")} × {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="price-line">
              <span>Cleaning fee</span>
              <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="price-line">
              <span>Airbnb service fee</span>
              <span>₹{serviceFee.toLocaleString("en-IN")}</span>
            </div>
            <hr className="price-rule" />
            <div className="price-line total-price-line">
              <span>Total Paid via Razorpay</span>
              <span className="total-amount-highlight">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </section>

        {/* 5. Terms & Conditions and Checkout Rules */}
        <section className="status-section">
          <h2 className="status-sec-title">Terms, Conditions & Checkout Policy</h2>
          <div className="status-rules-box">
            <div className="rule-item">
              <strong>1. Cancellation Policy:</strong>
              <p>
                Free cancellation up to 48 hours before check-in. Cancellations made within
                48 hours are subject to a 50% booking fee deduction.
              </p>
            </div>
            <div className="rule-item">
              <strong>2. Checkout Procedure:</strong>
              <p>
                Guests must vacate the property before 11:00 AM on the scheduled checkout
                date. Lock all doors, return keys to the designated lockbox, and dispose of
                trash in the outside bins.
              </p>
            </div>
            <div className="rule-item">
              <strong>3. House Rules & Quiet Hours:</strong>
              <p>
                No loud music or unauthorized parties between 10:00 PM and 7:00 AM.
                Smoking inside the unit is strictly prohibited and subject to a ₹5,000 deep-cleaning fee.
              </p>
            </div>
            <div className="rule-item">
              <strong>4. Security & Damage Policy:</strong>
              <p>
                Guests are financially responsible for any property damages, missing keys, or
                unauthorized extra guests discovered during post-checkout inspection.
              </p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="status-footer-actions">
          <button className="status-primary-btn" onClick={() => window.print()}>
            🖨️ Print Receipt
          </button>
          <button className="status-secondary-btn" onClick={() => navigate("/")}>
            Explore More Listings
          </button>
        </div>
      </div>
    </div>
  );
}