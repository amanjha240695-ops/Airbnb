import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  getHostDashboardApi, 
  updateListingPriceApi, 
  togglePublishReviewApi,
  snoozePropertyApi,
  reactivatePropertyApi,
  permanentlyDelistPropertyApi
} from "../../services/hostApi";
import {
  LayoutDashboard,
  CalendarCheck,
  Star,
  TrendingUp,
  Building,
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  User,
  Power,
  Edit2,
  Save,
  X,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
  Sliders,
  PauseCircle,
  PlayCircle,
  Trash2
} from "lucide-react";
import "./HostDashboard.css";

export default function HostDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem("host_online_status");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceForm, setPriceForm] = useState({ pricePerNight: "", cleaningFee: "", serviceFee: "" });
  const [priceUpdating, setPriceUpdating] = useState(false);
  const [statusNotice, setStatusNotice] = useState({ text: "", type: "" });

  const [snoozeModalProperty, setSnoozeModalProperty] = useState(null);
  const [snoozeForm, setSnoozeForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reason: "Renovation and Property Upgrades"
  });
  const [snoozeSubmitting, setSnoozeSubmitting] = useState(false);

  const [delistModalProperty, setDelistModalProperty] = useState(null);
  const [delistForm, setDelistForm] = useState({
    category: "PERSONAL_RESIDENCE",
    reason: ""
  });
  const [delistSubmitting, setDelistSubmitting] = useState(false);

  const [reactivatingId, setReactivatingId] = useState(null);

  // Silent sync without full-screen loading spinner
  const refreshDashData = async () => {
    try {
      const res = await getHostDashboardApi();
      const payload = res.data?.data || res.data;
      if (payload) {
        setData(payload);
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    }
  };

  const fetchDashData = async () => {
    try {
      setLoading(true);
      const res = await getHostDashboardApi();
      setData(res.data?.data || res.data);
    } catch (err) {
      console.error("Dashboard initial error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashData();
  }, []);

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    localStorage.setItem("host_online_status", JSON.stringify(nextState));
  };

  const handleStartEditPrice = (property) => {
    setEditingPriceId(property.id);
    setPriceForm({
      pricePerNight: property.pricePerNight,
      cleaningFee: property.cleaningFee || 0,
      serviceFee: property.serviceFee || 0,
    });
  };

  const handleSavePrice = async (propertyId) => {
    try {
      setPriceUpdating(true);
      await updateListingPriceApi(propertyId, priceForm);

      // Instant optimistic state update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          properties: (prev.properties || []).map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  pricePerNight: parseFloat(priceForm.pricePerNight),
                  cleaningFee: parseFloat(priceForm.cleaningFee || 0),
                  serviceFee: parseFloat(priceForm.serviceFee || 0),
                }
              : p
          ),
        };
      });

      setStatusNotice({ text: "Listing price successfully updated live on Airbnb!", type: "success" });
      setEditingPriceId(null);
      await refreshDashData();
    } catch (err) {
      setStatusNotice({ text: err.response?.data?.message || "Failed to update price", type: "error" });
    } finally {
      setPriceUpdating(false);
      setTimeout(() => setStatusNotice({ text: "", type: "" }), 4000);
    }
  };

  const handleToggleReviewPublish = async (reviewId, currentStatus) => {
    try {
      await togglePublishReviewApi(reviewId, !currentStatus);
      setStatusNotice({ 
        text: !currentStatus ? "Review published live to listing!" : "Review hidden from listing", 
        type: "success" 
      });
      await refreshDashData();
    } catch (err) {
      setStatusNotice({ text: err.response?.data?.message || "Failed to update review status", type: "error" });
    } finally {
      setTimeout(() => setStatusNotice({ text: "", type: "" }), 3000);
    }
  };

  const handleSnoozeSubmit = async (e) => {
    e.preventDefault();
    if (!snoozeModalProperty) return;
    const targetId = snoozeModalProperty.id;

    try {
      setSnoozeSubmitting(true);

      // 1. Instant Optimistic UI Update: immediately mark as SNOOZED
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          properties: (prev.properties || []).map((p) =>
            p.id === targetId
              ? {
                  ...p,
                  status: "SNOOZED",
                  snoozeStartDate: snoozeForm.startDate,
                  snoozeEndDate: snoozeForm.endDate,
                  snoozeReason: snoozeForm.reason,
                }
              : p
          ),
        };
      });

      const res = await snoozePropertyApi(targetId, snoozeForm);
      setStatusNotice({ text: res.data?.message || "Listing paused successfully.", type: "success" });
      setSnoozeModalProperty(null);
      await refreshDashData();
    } catch (err) {
      setStatusNotice({ text: err.response?.data?.message || "Failed to pause listing", type: "error" });
      await refreshDashData();
    } finally {
      setSnoozeSubmitting(false);
      setTimeout(() => setStatusNotice({ text: "", type: "" }), 4000);
    }
  };

  const handleReactivate = async (propertyId) => {
    try {
      setReactivatingId(propertyId);

      // 1. Instant Optimistic UI Update: immediately mark as APPROVED
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          properties: (prev.properties || []).map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  status: "APPROVED",
                  snoozeStartDate: null,
                  snoozeEndDate: null,
                  snoozeReason: null,
                }
              : p
          ),
        };
      });

      const res = await reactivatePropertyApi(propertyId);
      setStatusNotice({ 
        text: res.data?.message || "Property reactivated! Your stay is now live and searchable on Airbnb.", 
        type: "success" 
      });

      await refreshDashData();
    } catch (err) {
      console.error("Reactivate error:", err);
      setStatusNotice({ text: err.response?.data?.message || "Failed to reactivate listing", type: "error" });
      await refreshDashData();
    } finally {
      setReactivatingId(null);
      setTimeout(() => setStatusNotice({ text: "", type: "" }), 4000);
    }
  };

  const handleDelistSubmit = async (e) => {
    e.preventDefault();
    if (!delistModalProperty) return;
    if (delistForm.reason.trim().length < 10) {
      setStatusNotice({ text: "Please provide detailed feedback (min 10 characters).", type: "error" });
      return;
    }

    const targetPropertyId = delistModalProperty.id;

    try {
      setDelistSubmitting(true);

      // 1. Instant Optimistic UI Update: remove property from local state
      setData((prev) => {
        if (!prev) return prev;
        const remainingProps = (prev.properties || []).filter((p) => p.id !== targetPropertyId);
        return {
          ...prev,
          properties: remainingProps,
          stats: {
            ...prev.stats,
            totalListings: remainingProps.length,
          },
        };
      });

      if (selectedPropertyFilter === targetPropertyId) {
        setSelectedPropertyFilter("all");
      }

      setDelistModalProperty(null);
      setDelistForm({ category: "PERSONAL_RESIDENCE", reason: "" });

      const res = await permanentlyDelistPropertyApi(targetPropertyId, delistForm);
      setStatusNotice({ text: res.data?.message || "Listing permanently delisted.", type: "success" });

      await refreshDashData();
    } catch (err) {
      setStatusNotice({ text: err.response?.data?.message || "Failed to delist property", type: "error" });
      await refreshDashData();
    } finally {
      setDelistSubmitting(false);
      setTimeout(() => setStatusNotice({ text: "", type: "" }), 4000);
    }
  };

  const { stats, properties = [], bookings = [], reviews = [] } = data || {};
  const hostDisplayName = user?.name || "Airbnb Partner Host";

  const activeProperties = useMemo(() => {
    return properties.filter((p) => p.status !== "DELISTED");
  }, [properties]);

  useEffect(() => {
    if (selectedPropertyFilter !== "all") {
      const exists = activeProperties.some((p) => p.id === selectedPropertyFilter);
      if (!exists) {
        setSelectedPropertyFilter("all");
      }
    }
  }, [activeProperties, selectedPropertyFilter]);

  const filteredProperties = useMemo(() => {
    if (selectedPropertyFilter === "all") return activeProperties;
    return activeProperties.filter((p) => p.id === selectedPropertyFilter);
  }, [activeProperties, selectedPropertyFilter]);

  const filteredBookings = useMemo(() => {
    if (selectedPropertyFilter === "all") return bookings;
    return bookings.filter(
      (b) => b.propertyId === selectedPropertyFilter || b.property?.id === selectedPropertyFilter
    );
  }, [bookings, selectedPropertyFilter]);

  const filteredReviews = useMemo(() => {
    if (selectedPropertyFilter === "all") return reviews;
    return reviews.filter(
      (r) => r.propertyId === selectedPropertyFilter || r.property?.id === selectedPropertyFilter
    );
  }, [reviews, selectedPropertyFilter]);

  const scopedRevenue = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED" || b.payment?.status === "PAID")
      .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  }, [filteredBookings]);

  if (loading) {
    return (
      <div className="host-portal-loading">
        <div className="portal-spinner"></div>
        <p>Loading your Host Operations Portal...</p>
      </div>
    );
  }

  const renderPropertyFilter = () => {
    if (activeProperties.length <= 1) return null;
    return (
      <div className="host-property-filter-box">
        <label htmlFor="propertyFilterSelect" className="property-filter-label">
          Filter Stay:
        </label>
        <select
          id="propertyFilterSelect"
          className="property-filter-select"
          value={selectedPropertyFilter}
          onChange={(e) => setSelectedPropertyFilter(e.target.value)}
        >
          <option value="all">🏢 All Properties ({activeProperties.length})</option>
          {activeProperties.map((p) => (
            <option key={p.id} value={p.id}>
              📍 {p.title} ({p.city}) [{p.status}]
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="host-portal-container">
      {/* 1. LEFT SIDEBAR */}
      <aside className="host-sidebar">
        <div className="host-user-identity-card">
          <div className="host-avatar-box">
            {user?.avatar ? (
              <img src={user.avatar} alt={hostDisplayName} />
            ) : (
              <div className="host-avatar-placeholder">
                {hostDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="host-name-box">
            <h3 title={hostDisplayName}>{hostDisplayName}</h3>
            <span className="verified-badge-pill">
              <ShieldCheck size={12} /> Legal Host
            </span>
          </div>
        </div>

        <div className="host-availability-switch-card">
          <div className="switch-text-row">
            <span className="switch-status-label">
              <span className={`status-dot ${isOnline ? "dot-online" : "dot-offline"}`}></span>
              {isOnline ? "HOST ACTIVE" : "HOST OFFLINE"}
            </span>
          </div>
          <button 
            type="button" 
            className={`toggle-mode-btn ${isOnline ? "btn-online" : "btn-offline"}`}
            onClick={handleToggleOnline}
          >
            <Power size={14} />
            <span>{isOnline ? "Switch to Offline" : "Turn On Active Mode"}</span>
          </button>
        </div>

        <nav className="host-nav-list">
          <button
            type="button"
            className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            className={`nav-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <CalendarCheck size={18} />
            <span>Reservations</span>
            {filteredBookings.length > 0 && <span className="badge-count">{filteredBookings.length}</span>}
          </button>

          <button
            type="button"
            className={`nav-btn ${activeTab === "pricing" ? "active" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            <Sliders size={18} />
            <span>Pricing & Manage Stays</span>
          </button>

          <button
            type="button"
            className={`nav-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <Star size={18} />
            <span>Custom Reviews</span>
            {filteredReviews.length > 0 && <span className="badge-count">{filteredReviews.length}</span>}
          </button>

          <button
            type="button"
            className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <TrendingUp size={18} />
            <span>Income & Analytics</span>
          </button>
        </nav>

        <div className="sidebar-bottom-action">
          <Link to="/become-host" className="btn-add-listing">
            <Plus size={16} />
            <span>List Another Stay</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="host-main-content">
        {statusNotice.text && (
          <div className={`host-floating-alert ${statusNotice.type}`}>
            {statusNotice.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {!isOnline ? (
          <div className="host-offline-blocker">
            <div className="offline-card">
              <Power size={52} className="offline-power-icon" />
              <h2>Your Host Operations are Offline</h2>
              <p>
                Your properties are currently hidden from search to allow you time off. 
                Activate your online status in the sidebar whenever you are ready to manage bookings.
              </p>
              <button type="button" className="btn-resume-host" onClick={handleToggleOnline}>
                Go Online Now
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="tab-pane">
                <div className="pane-header">
                  <div>
                    <h1>Welcome, {hostDisplayName}</h1>
                    <p>Live overview of your Airbnb properties, earnings, and guest check-ins.</p>
                  </div>
                  {renderPropertyFilter()}
                </div>

                <div className="metrics-grid">
                  <div className="metric-box clickable" onClick={() => setActiveTab("analytics")}>
                    <div className="box-top">
                      <span>Total Revenue {selectedPropertyFilter !== "all" && "(Selected)"}</span>
                      <TrendingUp size={20} className="icon-gold" />
                    </div>
                    <h2>₹{Number(scopedRevenue).toLocaleString("en-IN")}</h2>
                    <span className="metric-foot green">
                      <ArrowUpRight size={14} /> Direct Payouts Received
                    </span>
                  </div>

                  <div className="metric-box clickable" onClick={() => setActiveTab("bookings")}>
                    <div className="box-top">
                      <span>Confirmed Reservations</span>
                      <CalendarCheck size={20} className="icon-blue" />
                    </div>
                    <h2>{filteredBookings.length}</h2>
                    <span className="metric-foot">Guest stays booked</span>
                  </div>

                  <div className="metric-box clickable" onClick={() => setActiveTab("pricing")}>
                    <div className="box-top">
                      <span>Managed Listings</span>
                      <Building size={20} className="icon-purple" />
                    </div>
                    <h2>{activeProperties.length}</h2>
                    <span className="metric-foot">Active stays on Airbnb</span>
                  </div>
                </div>

                <div className="dash-card-section">
                  <div className="section-title-row">
                    <h3>Latest Guest Bookings {selectedPropertyFilter !== "all" && "for Selected Stay"}</h3>
                    <button type="button" className="link-view-all" onClick={() => setActiveTab("bookings")}>
                      View All ({filteredBookings.length})
                    </button>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="empty-panel">
                      <Clock size={40} />
                      <p>No reservations found for this selection.</p>
                    </div>
                  ) : (
                    <div className="booking-cards-list">
                      {filteredBookings.slice(0, 5).map((b) => {
                        const isPaid = b.status === "CONFIRMED" || b.status === "COMPLETED" || b.payment?.status === "PAID";
                        return (
                          <div
                            key={b.id}
                            className="booking-row-item clickable"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <div className="user-avatar-tag">
                              {b.user?.avatar ? (
                                <img src={b.user.avatar} alt={b.user.name} />
                              ) : (
                                <User size={18} />
                              )}
                            </div>
                            <div className="row-main-info">
                              <strong>{b.user?.name || "Verified Guest"}</strong>
                              <span className="property-ref-title">
                                {b.property?.title || "Hosted Property"}
                              </span>
                            </div>
                            <div className="row-dates">
                              <span className="label-sub">STAY PERIOD</span>
                              <span>
                                {new Date(b.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} →{" "}
                                {new Date(b.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <div className="row-price">
                              <strong>₹{Number(b.totalAmount).toLocaleString("en-IN")}</strong>
                              <span className={`status-pill ${isPaid ? "status-paid" : "status-hold"}`}>
                                {isPaid ? "PAID" : b.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: BOOKINGS */}
            {activeTab === "bookings" && (
              <div className="tab-pane">
                <div className="pane-header">
                  <div>
                    <h1>Guest Reservations</h1>
                    <p>Click on any reservation row to view full check-in dates, guest contact, and payout details.</p>
                  </div>
                  {renderPropertyFilter()}
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="empty-panel">
                    <CalendarCheck size={44} />
                    <h3>No Reservations Recorded</h3>
                    <p>When guests book this stay, complete details will appear here.</p>
                  </div>
                ) : (
                  <div className="interactive-table-wrap">
                    <table className="interactive-table">
                      <thead>
                        <tr>
                          <th>Guest Name</th>
                          <th>Property Title</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Guests</th>
                          <th>Total Paid</th>
                          <th>Payment Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => {
                          const isPaid = b.status === "CONFIRMED" || b.status === "COMPLETED" || b.payment?.status === "PAID";
                          return (
                            <tr
                              key={b.id}
                              className="table-row-clickable"
                              onClick={() => setSelectedBooking(b)}
                            >
                              <td>
                                <strong>{b.user?.name || "Guest Traveller"}</strong>
                                <div className="cell-sub">{b.user?.email}</div>
                              </td>
                              <td>{b.property?.title}</td>
                              <td>{new Date(b.checkIn).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                              <td>{new Date(b.checkOut).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                              <td>{b.guests} Guest{b.guests > 1 ? "s" : ""}</td>
                              <td><strong>₹{Number(b.totalAmount).toLocaleString("en-IN")}</strong></td>
                              <td>
                                <span className={`status-pill ${isPaid ? "status-paid" : "status-hold"}`}>
                                  {isPaid ? "PAID" : b.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-view-pill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(b);
                                  }}
                                >
                                  <Eye size={13} /> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRICING & LIFECYCLE MANAGEMENT */}
            {activeTab === "pricing" && (
              <div className="tab-pane">
                <div className="pane-header">
                  <div>
                    <h1>Dynamic Rates & Listing Operations</h1>
                    <p>Manage daily pricing, temporary pause/renovation dates, or permanently delist properties.</p>
                  </div>
                  {renderPropertyFilter()}
                </div>

                <div className="pricing-grid">
                  {filteredProperties.map((prop) => {
                    const isEditing = editingPriceId === prop.id;
                    const isSnoozed = prop.status === "SNOOZED";
                    const isReactivatingThis = reactivatingId === prop.id;

                    const statusClass = isSnoozed ? "card-snoozed" : "card-live";
                    const badgeClass = isSnoozed ? "badge-snoozed" : "badge-live-stay";

                    return (
                      <div key={prop.id} className={`pricing-card ${statusClass}`}>
                        <div className="pricing-card-header">
                          <div>
                            <div className="property-title-badge-row">
                              <h3 className="property-heading">{prop.title}</h3>
                              <span className={`listing-status-badge ${badgeClass}`}>
                                {isSnoozed ? "PAUSED (RENOVATION)" : "LIVE ON AIRBNB"}
                              </span>
                            </div>
                            <p className="pricing-card-location">
                              <MapPin size={13} /> {prop.city}, {prop.state}
                            </p>
                          </div>

                          <div className="rate-action-header-buttons">
                            {!isEditing ? (
                              <button
                                type="button"
                                className="btn-edit-rate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditPrice(prop);
                                }}
                              >
                                <Edit2 size={14} /> Rate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-cancel-rate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPriceId(null);
                                }}
                              >
                                <X size={14} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {isSnoozed && (
                          <div className="status-notice-snoozed">
                            <p className="notice-main">
                              ⏸️ <strong>Listing Hidden from Travelers:</strong> Paused from{" "}
                              {prop.snoozeStartDate ? new Date(prop.snoozeStartDate).toLocaleDateString("en-IN") : "Now"} to{" "}
                              {prop.snoozeEndDate ? new Date(prop.snoozeEndDate).toLocaleDateString("en-IN") : "Indefinite"} ({prop.snoozeReason}).
                            </p>
                            <p className="notice-sub">
                              Click <strong>Reactivate Listing</strong> below whenever you are ready to welcome guests again.
                            </p>
                          </div>
                        )}

                        {!isEditing ? (
                          <div className="rate-display-box">
                            <div className="rate-item">
                              <span>PRICE PER NIGHT</span>
                              <strong>₹{Number(prop.pricePerNight).toLocaleString("en-IN")}</strong>
                            </div>
                            <div className="rate-item">
                              <span>CLEANING FEE</span>
                              <strong>₹{Number(prop.cleaningFee || 0).toLocaleString("en-IN")}</strong>
                            </div>
                            <div className="rate-item">
                              <span>SERVICE FEE</span>
                              <strong>₹{Number(prop.serviceFee || 0).toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="rate-edit-form">
                            <div className="rate-field">
                              <label>Price Per Night (₹)</label>
                              <input
                                type="number"
                                value={priceForm.pricePerNight}
                                onChange={(e) =>
                                  setPriceForm({ ...priceForm, pricePerNight: e.target.value })
                                }
                                placeholder="e.g. 2500"
                              />
                            </div>
                            <div className="rate-field">
                              <label>Cleaning Fee (₹)</label>
                              <input
                                type="number"
                                value={priceForm.cleaningFee}
                                onChange={(e) =>
                                  setPriceForm({ ...priceForm, cleaningFee: e.target.value })
                                }
                                placeholder="e.g. 300"
                              />
                            </div>
                            <div className="rate-field">
                              <label>Service Fee (₹)</label>
                              <input
                                type="number"
                                value={priceForm.serviceFee}
                                onChange={(e) =>
                                  setPriceForm({ ...priceForm, serviceFee: e.target.value })
                                }
                                placeholder="e.g. 150"
                              />
                            </div>

                            <button
                              type="button"
                              className="btn-save-price"
                              disabled={priceUpdating}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSavePrice(prop.id);
                              }}
                            >
                              <Save size={15} />
                              <span>{priceUpdating ? "Syncing..." : "Update Live Rate"}</span>
                            </button>
                          </div>
                        )}

                        <div className="lifecycle-operations-bar">
                          {isSnoozed ? (
                            <button
                              type="button"
                              className="btn-reactivate-stay"
                              disabled={isReactivatingThis}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleReactivate(prop.id);
                              }}
                            >
                              <PlayCircle size={15} />
                              <span>{isReactivatingThis ? "Reactivating..." : "Reactivate Listing"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-pause-stay"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSnoozeModalProperty(prop);
                                setSnoozeForm({
                                  startDate: new Date().toISOString().split("T")[0],
                                  endDate: "",
                                  reason: "Renovation and Property Upgrades"
                                });
                              }}
                            >
                              <PauseCircle size={15} /> Pause / Renovation
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-delist-stay"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDelistModalProperty(prop);
                              setDelistForm({ category: "PERSONAL_RESIDENCE", reason: "" });
                            }}
                          >
                            <Trash2 size={15} /> Delist Permanently
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === "reviews" && (
              <div className="tab-pane">
                <div className="pane-header">
                  <div>
                    <h1>Custom Guest Reviews Moderation</h1>
                    <p>Inspect verified reviews submitted by guests. Only reviews that you approve will be published live to your Airbnb stay.</p>
                  </div>
                  {renderPropertyFilter()}
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="empty-panel">
                    <Star size={44} color="#94a3b8" />
                    <h3>No Guest Reviews for this Stay</h3>
                    <p>When guests review this listing, their feedback will show up here for moderation.</p>
                  </div>
                ) : (
                  <div className="reviews-hub-grid">
                    {filteredReviews.map((rev) => {
                      const isApproved = rev.isPublished ?? true;
                      return (
                        <div key={rev.id} className="review-card-item">
                          <div className="review-header">
                            <div>
                              <strong>{rev.user?.name || "Verified Guest"}</strong>
                              <div className="star-rating">
                                {"★".repeat(rev.rating || 5)}{"☆".repeat(Math.max(0, 5 - (rev.rating || 5)))} ({Number(rev.rating || 5).toFixed(1)})
                              </div>
                              <span className="review-stay-title">
                                Stay: {rev.property?.title || "Hosted Property"}
                              </span>
                            </div>
                            <span className={isApproved ? "badge-verified" : "badge-pending-tag"}>
                              {isApproved ? "Live" : "Hidden"}
                            </span>
                          </div>
                          <p className="review-comment">"{rev.comment}"</p>
                          <div className="review-actions">
                            <button
                              type="button"
                              className={`btn-publish-review ${isApproved ? "approved" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReviewPublish(rev.id, isApproved);
                              }}
                            >
                              <CheckCircle size={14} />
                              <span>{isApproved ? "Live on Listing (Click to Hide)" : "Approve & Publish to Listing"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="tab-pane">
                <div className="pane-header">
                  <div>
                    <h1>Earnings Breakdown & Occupancy Trends</h1>
                    <p>Track your payout trajectory and monthly gross income performance.</p>
                  </div>
                  {renderPropertyFilter()}
                </div>

                <div className="analytics-summary-cards">
                  <div className="income-card card-dark">
                    <span>Gross Cleared Payout</span>
                    <h1>₹{Number(scopedRevenue).toLocaleString("en-IN")}</h1>
                    <p>Directly reconciled to your linked bank account</p>
                  </div>

                  <div className="income-card">
                    <span>Average Daily Rate (ADR)</span>
                    <h1>
                      ₹
                      {filteredProperties[0]?.pricePerNight
                        ? Number(filteredProperties[0].pricePerNight).toLocaleString("en-IN")
                        : "0"}
                    </h1>
                    <p>Base night charge configured on selected stay</p>
                  </div>

                  <div className="income-card">
                    <span>Occupancy Rate</span>
                    <h1>78%</h1>
                    <p>Peak utilization across active weekends</p>
                  </div>
                </div>

                <div className="chart-wrapper-card">
                  <h3>Monthly Revenue Breakdown (INR)</h3>
                  <div className="bar-chart-container">
                    <div className="bar-group">
                      <div className="bar bar-45" title="₹18,000"></div>
                      <span className="bar-label">Jun</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar bar-65" title="₹26,000"></div>
                      <span className="bar-label">Jul</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar bar-55" title="₹22,000"></div>
                      <span className="bar-label">Aug</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar bar-80" title="₹32,000"></div>
                      <span className="bar-label">Sep</span>
                    </div>
                    <div className="bar-group">
                      <div className="bar active-bar bar-95" title="₹42,000"></div>
                      <span className="bar-label">Oct (Current)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. CLICKABLE RESERVATION MODAL / DRAWER */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Guest Reservation Details</h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedBooking(null)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="booking-ref-tags-row">
                <span className="ref-tag">
                  Booking ID: <strong>{selectedBooking.id}</strong>
                </span>
                {selectedBooking.payment?.razorpayPaymentId && (
                  <span className="ref-tag">
                    Txn ID: <strong>{selectedBooking.payment.razorpayPaymentId}</strong>
                  </span>
                )}
              </div>

              <div className="drawer-section">
                <label>PRIMARY GUEST & CONTACT</label>
                <div className="guest-summary-row">
                  <div className="user-avatar-tag drawer-avatar">
                    {selectedBooking.user?.avatar ? (
                      <img src={selectedBooking.user.avatar} alt={selectedBooking.user.name} />
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                  <div>
                    <h3 className="guest-title-name">{selectedBooking.user?.name || "Verified Guest"}</h3>
                    <span className="guest-subtitle-tag">Registered Airbnb Traveller</span>
                  </div>
                </div>
                <p className="contact-text">📧 <strong>Email:</strong> {selectedBooking.user?.email || "guest@airbnb.com"}</p>
                <p className="contact-text">📞 <strong>Phone:</strong> {selectedBooking.user?.phone || "+91 98765 43210"}</p>
                <p className="contact-text">👥 <strong>Party Size:</strong> {selectedBooking.guests} Guest{selectedBooking.guests > 1 ? "s" : ""} Total</p>
              </div>

              <div className="drawer-section">
                <label>BOOKED PROPERTY</label>
                <h4 className="drawer-prop-title">{selectedBooking.property?.title}</h4>
                <p className="drawer-prop-address">
                  📍 {selectedBooking.property?.address || "Prime Location"}, {selectedBooking.property?.city}, {selectedBooking.property?.state || "India"}
                </p>
              </div>

              <div className="drawer-section">
                <label>STAY SCHEDULE & TIMINGS</label>
                <div className="dates-preview-box">
                  <div>
                    <span>CHECK-IN</span>
                    <strong>
                      {new Date(selectedBooking.checkIn).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                    <p className="check-time-hint">After 2:00 PM</p>
                  </div>
                  <div className="arrow">→</div>
                  <div>
                    <span>CHECK-OUT</span>
                    <strong>
                      {new Date(selectedBooking.checkOut).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                    <p className="check-time-hint">Before 11:00 AM</p>
                  </div>
                </div>
                <p className="duration-highlight">
                  🌙 <strong>Total Duration:</strong> {selectedBooking.nights || 1} Night{selectedBooking.nights > 1 ? "s" : ""}
                </p>
              </div>

              <div className="drawer-section">
                <label>PAYMENT & PAYOUT SUMMARY</label>
                <div className="bill-row">
                  <span>Base Rate:</span>
                  <span>
                    ₹{Number(selectedBooking.pricePerNight || selectedBooking.property?.pricePerNight || 0).toLocaleString("en-IN")} × {selectedBooking.nights || 1} night{(selectedBooking.nights || 1) > 1 ? "s" : ""}
                  </span>
                </div>

                {Number(selectedBooking.cleaningFee || selectedBooking.property?.cleaningFee || 0) > 0 && (
                  <div className="bill-row">
                    <span>Cleaning Fee:</span>
                    <span>₹{Number(selectedBooking.cleaningFee || selectedBooking.property?.cleaningFee).toLocaleString("en-IN")}</span>
                  </div>
                )}

                {Number(selectedBooking.serviceFee || selectedBooking.property?.serviceFee || 0) > 0 && (
                  <div className="bill-row">
                    <span>Airbnb Service Fee:</span>
                    <span>₹{Number(selectedBooking.serviceFee || selectedBooking.property?.serviceFee).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="bill-row bill-total-divider">
                  <span>Gross Payout:</span>
                  <strong className="price-highlight">
                    ₹{Number(selectedBooking.totalAmount).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="bill-row">
                  <span>Payment Status:</span>
                  <span className={`status-pill ${selectedBooking.status === "CONFIRMED" || selectedBooking.status === "COMPLETED" || selectedBooking.payment?.status === "PAID" ? "status-paid" : "status-hold"}`}>
                    {selectedBooking.status === "CONFIRMED" || selectedBooking.status === "COMPLETED" || selectedBooking.payment?.status === "PAID" ? "PAID" : selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.payment?.method && (
                  <div className="bill-row">
                    <span>Payment Channel:</span>
                    <span className="payment-channel-name">{selectedBooking.payment.method}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: SNOOZE / TEMPORARY PAUSE (RENOVATION) */}
      {snoozeModalProperty && (
        <div className="modal-overlay" onClick={() => setSnoozeModalProperty(null)}>
          <div className="modal-drawer modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Pause Listing for Renovation</h2>
              <button type="button" className="btn-close" onClick={() => setSnoozeModalProperty(null)}>✕</button>
            </div>
            <div className="drawer-body">
              <p className="modal-lead-desc">
                Temporarily hide <strong>{snoozeModalProperty.title}</strong> from search results. Travelers won't be able to book during this period.
              </p>

              <form onSubmit={handleSnoozeSubmit} className="modal-form-vertical">
                <div className="form-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={snoozeForm.startDate}
                    onChange={(e) => setSnoozeForm({ ...snoozeForm, startDate: e.target.value })}
                  />
                </div>

                <div className="form-input-group">
                  <label>Estimated End Date (When renovation finishes)</label>
                  <input
                    type="date"
                    required
                    value={snoozeForm.endDate}
                    onChange={(e) => setSnoozeForm({ ...snoozeForm, endDate: e.target.value })}
                  />
                </div>

                <div className="form-input-group">
                  <label>Reason for Archiving</label>
                  <select
                    value={snoozeForm.reason}
                    onChange={(e) => setSnoozeForm({ ...snoozeForm, reason: e.target.value })}
                  >
                    <option value="Renovation and Property Upgrades">Renovation & Repairs</option>
                    <option value="Personal Family Usage">Personal Family Usage (Making it home)</option>
                    <option value="Seasonal Shutdown">Seasonal / Winter Break</option>
                    <option value="Plumbing or Electrical Maintenance">Maintenance & Pest Control</option>
                  </select>
                </div>

                <div className="modal-callout-info">
                  ℹ️ <strong>Note:</strong> When the end date arrives, the stay will NOT go live automatically. You will need to come back to this dashboard and click <strong>Reactivate Listing</strong>.
                </div>

                <div className="modal-form-actions-row">
                  <button
                    type="button"
                    className="btn-modal-back"
                    onClick={() => setSnoozeModalProperty(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-pause-confirm"
                    disabled={snoozeSubmitting}
                  >
                    {snoozeSubmitting ? "Archiving..." : "Confirm Pause"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: PERMANENT DELIST (WITH EXIT SURVEY) */}
      {delistModalProperty && (
        <div className="modal-overlay" onClick={() => setDelistModalProperty(null)}>
          <div className="modal-drawer modal-delist" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Delist Property Permanently</h2>
              <button type="button" className="btn-close" onClick={() => setDelistModalProperty(null)}>✕</button>
            </div>
            <div className="drawer-body">
              <p className="modal-lead-desc">
                You are about to permanently remove <strong>{delistModalProperty.title}</strong> from Airbnb.
              </p>

              <form onSubmit={handleDelistSubmit} className="modal-form-vertical">
                <div className="form-input-group">
                  <label>Why are you dehosting this property?</label>
                  <select
                    value={delistForm.category}
                    onChange={(e) => setDelistForm({ ...delistForm, category: e.target.value })}
                  >
                    <option value="PERSONAL_RESIDENCE">Converting back to personal normal home</option>
                    <option value="SOLD_PROPERTY">I sold or gave up the lease on this property</option>
                    <option value="PLATFORM_FEEDBACK">Issues with platform policies or payouts</option>
                    <option value="GUEST_EXPERIENCES">Difficulty managing guests / noise issues</option>
                    <option value="RELOCATING">Relocating to another city</option>
                    <option value="OTHER">Other reasons</option>
                  </select>
                </div>

                <div className="form-input-group">
                  <label>Detailed Feedback & Explanation (Required)</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Tell us more about your decision (e.g., We moved back with family, or payout speeds weren't ideal)..."
                    value={delistForm.reason}
                    onChange={(e) => setDelistForm({ ...delistForm, reason: e.target.value })}
                  />
                  <span className="min-char-counter">Minimum 10 characters required</span>
                </div>

                <div className="modal-callout-danger">
                  ⚠️ <strong>Warning:</strong> Delisting is permanent. The property will be removed from public search, but past reservation and payout records remain saved for your tax records.
                </div>

                <div className="modal-form-actions-row">
                  <button
                    type="button"
                    className="btn-modal-back"
                    onClick={() => setDelistModalProperty(null)}
                  >
                    Keep Property
                  </button>
                  <button
                    type="submit"
                    className={`btn-modal-delist-confirm ${delistForm.reason.trim().length >= 10 ? "ready" : "disabled"}`}
                    disabled={delistSubmitting || delistForm.reason.trim().length < 10}
                  >
                    {delistSubmitting ? "Delisting..." : "Submit & Delist"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}