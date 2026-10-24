import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Printer,
  Home,
  RefreshCw,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import "./CancelBookingModal.css";

export default function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onConfirmCancel,
}) {
  const [step, setStep] = useState("confirm"); // "confirm" | "receipt"
  const [loading, setLoading] = useState(false);
  const [cancellationRef, setCancellationRef] = useState(null);

  if (!isOpen || !booking) return null;

  const property = booking.property || {};
  const host = property.host || {};
  const user = booking.user || {};

  const rawCheckIn = booking.checkIn || booking.startDate;
  const rawCheckOut = booking.checkOut || booking.endDate;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const totalPaid = Number(
    booking.totalAmount !== undefined
      ? booking.totalAmount
      : booking.totalPrice || 0
  );
  const refundAmount = totalPaid;

  const handleProceedCancel = async () => {
    try {
      setLoading(true);
      await onConfirmCancel(booking.id);
      setCancellationRef(
        `REFUND-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      );
      setStep("receipt");
    } catch (err) {
      alert(err.message || "Could not complete cancellation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cancel-modal-backdrop" onClick={onClose}>
      <div className="cancel-modal-card" onClick={(e) => e.stopPropagation()}>
        {step === "confirm" ? (
          <div className="cancel-confirm-step">
            <div className="cancel-modal-header">
              <div className="warning-icon-badge">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2>Cancel this reservation?</h2>
                <p className="cancel-modal-sub">
                  Review your cancellation details and refund summary below.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cancel-details-body">
              <div className="stay-cancel-preview">
                <strong>{property.title || "Reserved Property"}</strong>
                <p>
                  {[property.city, property.country || "India"]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <span className="stay-cancel-dates">
                  {formatDate(rawCheckIn)} – {formatDate(rawCheckOut)}
                </span>
              </div>

              <div className="refund-summary-box">
                <div className="refund-summary-header">
                  <CheckCircle size={18} className="refund-check-icon" />
                  <strong>Eligible for 100% Full Refund</strong>
                </div>
                <div className="refund-row">
                  <span>Total amount paid</span>
                  <span>₹{totalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="refund-row">
                  <span>Cancellation penalty</span>
                  <span className="text-free">₹0 (Free)</span>
                </div>
                <div className="refund-divider" />
                <div className="refund-row total-refund-row">
                  <strong>Total Refund to you</strong>
                  <strong className="refund-amount-highlight">
                    ₹{refundAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="refund-meta-note">
                <CreditCard size={15} />
                <span>
                  The full amount of <strong>₹{refundAmount.toLocaleString("en-IN")}</strong> will
                  be credited back to your original payment method within 3–5 business days.
                </span>
              </div>
            </div>

            <div className="cancel-modal-footer">
              <button
                type="button"
                className="btn-keep-stay"
                onClick={onClose}
                disabled={loading}
              >
                Keep Reservation
              </button>
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={handleProceedCancel}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="spinner-icon" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Confirm Cancellation & Refund"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="cancel-receipt-step">
            <div className="receipt-actions-bar no-print">
              <button type="button" className="receipt-print-btn" onClick={handlePrint}>
                <Printer size={15} />
                <span>Print Cancellation Receipt</span>
              </button>
              <button type="button" className="modal-close-icon" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="receipt-printable-area">
              <div className="receipt-brand-row">
                <div className="receipt-logo">
                  <Home size={24} className="receipt-logo-icon" />
                  <span>airbnb</span>
                </div>
                <div className="cancellation-badge">
                  <span>CANCELLED & REFUNDED</span>
                </div>
              </div>

              <h2 className="receipt-headline">Cancellation & Refund Receipt</h2>
              <p className="receipt-sub-id">
                Confirmation:{" "}
                <strong>{booking.id?.slice(0, 10).toUpperCase()}</strong> · Refund Ref:{" "}
                <strong>{cancellationRef}</strong>
              </p>

              <div className="receipt-divider" />

              <div className="cancellation-details-grid">
                <div>
                  <span className="meta-label">Original Booking</span>
                  <strong>{property.title}</strong>
                  <p className="meta-sub">
                    {[property.address, property.city, property.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div>
                  <span className="meta-label">Dates</span>
                  <strong>
                    {formatDate(rawCheckIn)} – {formatDate(rawCheckOut)}
                  </strong>
                </div>
                <div>
                  <span className="meta-label">Host</span>
                  <strong>{host.name || "Airbnb Host"}</strong>
                </div>
                <div>
                  <span className="meta-label">Guest</span>
                  <strong>{user.name || "Guest Traveler"}</strong>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="refund-math-table">
                <h3>Refund Breakdown</h3>
                <div className="refund-row">
                  <span>Original Booking Payment</span>
                  <span>₹{totalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="refund-row">
                  <span>Cancellation Fees</span>
                  <span className="text-free">- ₹0</span>
                </div>
                <div className="receipt-divider" />
                <div className="refund-row total-refund-row">
                  <strong>Total Refund Issued</strong>
                  <strong className="refund-amount-highlight">
                    ₹{refundAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-guarantee-box">
                <ShieldCheck size={18} />
                <div>
                  <strong>Refund Status: Processed</strong>
                  <p>
                    Your full refund of ₹{refundAmount.toLocaleString("en-IN")} has been initiated.
                    Depending on your bank, it will appear in your statement within 3 to 5 business days.
                  </p>
                </div>
              </div>
            </div>

            <div className="receipt-footer-close no-print">
              <button type="button" className="btn-done" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}