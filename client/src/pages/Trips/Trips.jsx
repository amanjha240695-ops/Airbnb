import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookingsApi, cancelBookingApi } from "../../services/bookingApi";
import ReceiptModal from "../../components/booking/ReceiptModal";
import CancelBookingModal from "../../components/booking/CancelBookingModal";
import "./Trips.css";

export default function Trips() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyBookingsApi();

      const list =
        res?.data?.bookings ||
        res?.data?.data?.bookings ||
        res?.data?.data ||
        res?.data ||
        [];

      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Trips Fetch Error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load your trips.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleConfirmCancel = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await cancelBookingApi(bookingId, "Trip cancelled by guest with full refund");
      await fetchTrips();
    } finally {
      setActionLoading(null);
    }
  };

  const now = new Date();

  // Normalize statuses and dates regardless of casing or schema keys
  const getBookingStatus = (b) => (b.status || "").toUpperCase();

  const getCheckOutDate = (b) => {
    const raw = b.checkOut || b.endDate || b.checkout;
    return raw ? new Date(raw) : null;
  };

  // 1. Upcoming Stays: Confirmed reservations whose checkout is in the future
  const upcomingBookings = bookings.filter((b) => {
    const status = getBookingStatus(b);
    const checkOut = getCheckOutDate(b);
    return status === "CONFIRMED" && (!checkOut || checkOut >= now);
  });

  // 2. Past Stays: Completed reservations, or confirmed reservations whose checkout has passed
  const pastBookings = bookings.filter((b) => {
    const status = getBookingStatus(b);
    const checkOut = getCheckOutDate(b);
    const isCompleted = status === "COMPLETED";
    const hasPassed = status === "CONFIRMED" && checkOut && checkOut < now;
    return isCompleted || hasPassed;
  });

  // 3. Cancelled Bookings
  const cancelledBookings = bookings.filter((b) => getBookingStatus(b) === "CANCELLED");

  const displayedBookings =
    activeTab === "upcoming"
      ? upcomingBookings
      : activeTab === "past"
      ? pastBookings
      : cancelledBookings;

  return (
    <div className="trips-container">
      <div className="trips-header">
        <h1>Trips</h1>
        <p>Manage your upcoming reservations, review past stays, and view booking receipts.</p>
      </div>
      {/*empty state when nothing found*/}
      <EmptyState
  title="No trips booked... yet!"
  subtitle="Time to dust off your bags and start planning your next great adventure."
  actionLabel="Start searching"
  actionPath="/"
/>

      {/* Filter Navigation Tabs */}
      <div className="trips-tabs">
        <button
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "past" ? "active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past Stays ({pastBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled ({cancelledBookings.length})
        </button>
      </div>

      {error && (
        <div className="trips-error-banner">
          <span>{error}</span>
          {error.includes("token") && (
            <button
              className="login-redirect-btn"
              onClick={() => navigate("/login")}
            >
              Log In Again
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="trips-loading">
          <div className="trips-spinner"></div>
          <p>Fetching your reservations...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="trips-empty-state">
          <div className="empty-icon">✈️</div>
          <h3>No {activeTab} trips found</h3>
          <p>Time to pack your bags and start planning your next getaway.</p>
          <button className="trips-explore-btn" onClick={() => navigate("/")}>
            Explore Stays
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {displayedBookings.map((b) => {
            const prop = b.property || {};

            const cover =
              prop.images?.find?.((img) => img.isCover)?.url ||
              prop.images?.[0]?.url ||
              (typeof prop.images?.[0] === "string" ? prop.images[0] : null) ||
              "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80";

            const rawCheckIn = b.checkIn || b.startDate;
            const rawCheckOut = b.checkOut || b.endDate;

            const checkIn = rawCheckIn
              ? new Date(rawCheckIn).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            const checkOut = rawCheckOut
              ? new Date(rawCheckOut).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A";

            const displayAmount = Number(
              b.totalAmount !== undefined ? b.totalAmount : (b.totalPrice || 0)
            );

            return (
              <div key={b.id} className="trip-card">
                <div className="trip-card-image-wrap">
                  <img
                    src={cover}
                    alt={prop.title || "Stay"}
                    className="trip-card-img"
                  />
                  <span className={`trip-status-tag status-${b.status?.toLowerCase()}`}>
                    {b.status}
                  </span>
                </div>

                <div className="trip-card-body">
                  <span className="trip-city">
                    {prop.city ? `📍 ${prop.city}` : "Listing"}
                  </span>
                  <h3
                    className="trip-title"
                    onClick={() => prop.id && navigate(`/property/${prop.id}`)}
                  >
                    {prop.title || "Reserved Property"}
                  </h3>

                  <div className="trip-meta-row">
                    <div>
                      <span className="meta-label">Dates</span>
                      <p className="meta-value">
                        {checkIn} – {checkOut}
                      </p>
                    </div>
                    <div>
                      <span className="meta-label">Total Paid</span>
                      <p className="meta-value trip-price">
                        ₹{displayAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="trip-card-actions">
                    <button
                      type="button"
                      className="btn-view-receipt"
                      onClick={() =>
                        setSelectedReceiptBooking({
                          ...b,
                          startDate: rawCheckIn,
                          endDate: rawCheckOut,
                          totalPrice: displayAmount,
                        })
                      }
                    >
                      View Receipt
                    </button>

                    {activeTab === "upcoming" && b.status?.toUpperCase() === "CONFIRMED" && (
                      <button
                        type="button"
                        className="btn-cancel-trip"
                        disabled={actionLoading === b.id}
                        onClick={() =>
                          setCancellingBooking({
                            ...b,
                            startDate: rawCheckIn,
                            endDate: rawCheckOut,
                            totalPrice: displayAmount,
                          })
                        }
                      >
                        {actionLoading === b.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Receipt Modal */}
      {selectedReceiptBooking && (
        <ReceiptModal
          booking={selectedReceiptBooking}
          onClose={() => setSelectedReceiptBooking(null)}
        />
      )}

      {/* Cancel & 100% Refund Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          isOpen={Boolean(cancellingBooking)}
          onClose={() => setCancellingBooking(null)}
          onConfirmCancel={handleConfirmCancel}
        />
      )}
    </div>
  );
  
}