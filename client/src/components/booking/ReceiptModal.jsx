import React from "react";
import {
  X,
  Printer,
  CheckCircle,
  Home,
  Calendar,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Key,
  ShieldCheck,
  Compass,
  AlertCircle,
} from "lucide-react";
import "./ReceiptModal.css";

export default function ReceiptModal({ booking, onClose }) {
  if (!booking) return null;

  const property = booking.property || {};
  const host = property.host || {};
  const user = booking.user || {};

  const checkInDate = booking.startDate
    ? new Date(booking.startDate)
    : booking.checkIn
    ? new Date(booking.checkIn)
    : null;

  const checkOutDate = booking.endDate
    ? new Date(booking.endDate)
    : booking.checkOut
    ? new Date(booking.checkOut)
    : null;

  const formatDate = (date) =>
    date
      ? date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const totalNights =
    checkInDate && checkOutDate
      ? Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)))
      : booking.totalNights || 1;

  const pricePerNight = Number(booking.pricePerNight || property.pricePerNight || 0);
  const baseSubtotal = pricePerNight * totalNights;
  const cleaningFee = Number(booking.cleaningFee || property.cleaningFee || 0);
  const serviceFee = Number(booking.serviceFee || property.serviceFee || 0);
  const totalPrice = Number(
    booking.totalPrice || booking.totalAmount || baseSubtotal + cleaningFee + serviceFee
  );

  const fullAddress = [
    property.address,
    property.city,
    property.state,
    property.zipCode,
    property.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-backdrop" onClick={onClose}>
      <div className="receipt-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="receipt-actions no-print">
          <button type="button" className="receipt-action-btn" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt / PDF</span>
          </button>
          <button type="button" className="receipt-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Printable Area */}
        <div className="receipt-printable-area">
          {/* Top Header */}
          <div className="receipt-brand-row">
            <div className="receipt-logo">
              <Home size={26} className="receipt-brand-icon" />
              <span>airbnb</span>
            </div>
            <div className="receipt-status-pill">
              <CheckCircle size={14} />
              <span>{booking.status || "CONFIRMED"}</span>
            </div>
          </div>

          <div className="receipt-header-meta">
            <div>
              <h2 className="receipt-title">Official Guest Receipt</h2>
              <p className="receipt-code-line">
                Confirmation Code:{" "}
                <strong>{booking.id?.slice(0, 10).toUpperCase() || "AIRBNB-STAY"}</strong>
              </p>
            </div>
            <div className="receipt-booking-date">
              <span>Booked on:</span>
              <strong>
                {new Date(booking.createdAt || Date.now()).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* 1. Arrival & Check-in Schedule */}
          <div className="receipt-section">
            <h3 className="receipt-section-heading">Schedule & Timing</h3>
            <div className="stay-schedule-grid">
              <div className="schedule-item">
                <Clock size={16} className="schedule-icon" />
                <div>
                  <span className="schedule-label">CHECK-IN TIME</span>
                  <strong>{formatDate(checkInDate)}</strong>
                  <span className="schedule-sub">From 2:00 PM</span>
                </div>
              </div>

              <div className="schedule-item">
                <Clock size={16} className="schedule-icon" />
                <div>
                  <span className="schedule-label">CHECK-OUT TIME</span>
                  <strong>{formatDate(checkOutDate)}</strong>
                  <span className="schedule-sub">Until 11:00 AM</span>
                </div>
              </div>

              <div className="schedule-item">
                <Users size={16} className="schedule-icon" />
                <div>
                  <span className="schedule-label">TOTAL TRAVELERS</span>
                  <strong>
                    {booking.guests || 1} {(booking.guests || 1) === 1 ? "Guest" : "Guests"}
                  </strong>
                  <span className="schedule-sub">Entire accommodation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* 2. Destination & Arrival Contact (WHO TO CONTACT) */}
          <div className="receipt-section">
            <h3 className="receipt-section-heading">Whom to Contact on Arrival</h3>
            <div className="receipt-contact-box">
              <div className="contact-host-profile">
                {host.avatar ? (
                  <img src={host.avatar} alt={host.name} className="contact-avatar-img" />
                ) : (
                  <div className="contact-avatar-fallback">
                    {host.name ? host.name.charAt(0).toUpperCase() : "H"}
                  </div>
                )}
                <div>
                  <strong className="contact-host-name">{host.name || "Property Host"}</strong>
                  <span className="contact-host-tag">Dedicated Host</span>
                </div>
              </div>

              <div className="contact-methods-grid">
                <div className="contact-method-item">
                  <Phone size={15} />
                  <div>
                    <span className="contact-label">Phone / WhatsApp</span>
                    <strong>{host.phone || "+91 98765 43210"}</strong>
                  </div>
                </div>

                <div className="contact-method-item">
                  <Mail size={15} />
                  <div>
                    <span className="contact-label">Host Email</span>
                    <strong>{host.email || "support-host@airbnb.com"}</strong>
                  </div>
                </div>

                <div className="contact-method-item full-width">
                  <Key size={15} />
                  <div>
                    <span className="contact-label">Key Exchange & Arrival Instructions</span>
                    <p className="arrival-instruction-text">
                      Please call or message <strong>{host.name || "the host"}</strong> 30 minutes
                      prior to reaching the property. The caretaker will be at the front desk / gate
                      with physical keys and will guide you to your stay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* 3. Property Location & Address */}
          <div className="receipt-section">
            <h3 className="receipt-section-heading">Listing Location & Address</h3>
            <div className="receipt-address-box">
              <MapPin size={20} className="address-pin-icon" />
              <div>
                <strong className="address-property-title">{property.title || "Stay Name"}</strong>
                <p className="address-full-text">{fullAddress || "Address provided upon booking."}</p>
                <div className="address-actions-row no-print">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${property.title}${fullAddress}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-map-link"
                  >
                    <Compass size={14} />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* 4. Payment & Billing Breakdown */}
          <div className="receipt-section">
            <h3 className="receipt-section-heading">Payment Breakdown</h3>
            <div className="receipt-breakdown-list">
              <div className="breakdown-row">
                <span>
                  ₹{pricePerNight.toLocaleString("en-IN")} × {totalNights}{" "}
                  {totalNights === 1 ? "night" : "nights"}
                </span>
                <span>₹{baseSubtotal.toLocaleString("en-IN")}</span>
              </div>

              {cleaningFee > 0 && (
                <div className="breakdown-row">
                  <span>Cleaning & housekeeping fee</span>
                  <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
                </div>
              )}

              {serviceFee > 0 && (
                <div className="breakdown-row">
                  <span>Airbnb guest service fee</span>
                  <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="receipt-divider" />

              <div className="breakdown-row total-row">
                <strong>Total Amount Paid (INR)</strong>
                <strong className="total-highlight">₹{totalPrice.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          <div className="receipt-divider" />

          {/* 5. Guest Information & Safety Note */}
          <div className="receipt-footer-meta">
            <div className="footer-meta-item">
              <span>Primary Guest:</span>
              <strong>{user.name || "Guest Traveler"}</strong>
            </div>
            <div className="footer-meta-item">
              <span>Guest Email:</span>
              <strong>{user.email || "guest@example.com"}</strong>
            </div>
            <div className="footer-meta-item">
              <span>Payment Status:</span>
              <strong className="status-paid-text">Paid in Full</strong>
            </div>

            <div className="receipt-footer-security">
              <ShieldCheck size={16} />
              <span>
                AirCover protection: Your booking includes protection from host cancellations, listing
                inaccuracies, and 24/7 emergency support.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}