import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Menu,
  User,
  Home,
  LogOut,
  ShieldCheck,
  Compass,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./navbar.css";

export const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState("destination");

  // Search Form State
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [petsAllowed, setPetsAllowed] = useState(false);

  const menuRef = useRef(null);
  const searchBarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Robust check: catches role whether from context root or inside user object
  const activeRole = role || user?.role;
  const isHost = activeRole === "HOST";
  const isAdmin = activeRole === "ADMIN";

  // Populate from URL on load/change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("destination")) setDestination(params.get("destination"));
    if (params.get("checkIn")) setCheckIn(params.get("checkIn"));
    if (params.get("checkOut")) setCheckOut(params.get("checkOut"));
    if (params.get("guests")) setGuests(Number(params.get("guests")) || 1);
    if (params.get("pets")) setPetsAllowed(params.get("pets") === "true");
  }, [location.search]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", guests);
    if (petsAllowed) params.set("pets", "true");

    setSearchOpen(false);
    navigate(`/?${params.toString()}`);
  };

  const handleClearFilters = (e) => {
    e.stopPropagation();
    setDestination("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setPetsAllowed(false);
    navigate("/");
  };

  const quickCities = ["Goa", "Manali", "Delhi", "Rishikesh", "Jaipur", "Mumbai"];

  const formatPreviewDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const datePreview =
    checkIn && checkOut
      ? `${formatPreviewDate(checkIn)} – ${formatPreviewDate(checkOut)}`
      : checkIn
      ? `From ${formatPreviewDate(checkIn)}`
      : "Stay Window";

  return (
    <header className="navbar-header sticky-header">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <Home size={28} />
          <span>airbnb</span>
        </Link>

        {/* Central Search Pill */}
        <div className="search-pill-wrapper" ref={searchBarRef}>
          <div
            className={`navbar-search-pill ${searchOpen ? "pill-expanded" : ""}`}
            onClick={() => setSearchOpen((prev) => !prev)}
          >
            <div className="pill-segment">
              <span className="pill-title">
                {destination ? (
                  <strong className="active-pill-text">{destination}</strong>
                ) : (
                  "Explore Cities"
                )}
              </span>
            </div>

            <span className="search-divider">|</span>

            <div className="pill-segment">
              <span className={`pill-title ${checkIn ? "active-pill-text" : "search-muted-text"}`}>
                {datePreview}
              </span>
            </div>

            <span className="search-divider">|</span>

            <div className="pill-segment">
              <span className={`pill-title ${guests > 1 || petsAllowed ? "active-pill-text" : "search-muted-text"}`}>
                {guests} {guests === 1 ? "Guest" : "Guests"}
                {petsAllowed && " · 🐾"}
              </span>
            </div>

            <button
              type="button"
              className="search-icon-circle"
              onClick={(e) => {
                e.stopPropagation();
                if (!searchOpen) {
                  setSearchOpen(true);
                } else {
                  handleSearchSubmit(e);
                }
              }}
              aria-label="Search stays"
            >
              <Search size={15} />
            </button>
          </div>

          {/* Interactive Popover Dropdown */}
          {searchOpen && (
            <div className="search-popover-panel" onClick={(e) => e.stopPropagation()}>
              <div className="popover-tabs">
                <button
                  type="button"
                  className={`popover-tab-btn ${activeSegment === "destination" ? "tab-active" : ""}`}
                  onClick={() => setActiveSegment("destination")}
                >
                  <MapPin size={15} />
                  <span>Destination</span>
                </button>
                <button
                  type="button"
                  className={`popover-tab-btn ${activeSegment === "dates" ? "tab-active" : ""}`}
                  onClick={() => setActiveSegment("dates")}
                >
                  <Calendar size={15} />
                  <span>Stay Window</span>
                </button>
                <button
                  type="button"
                  className={`popover-tab-btn ${activeSegment === "guests" ? "tab-active" : ""}`}
                  onClick={() => setActiveSegment("guests")}
                >
                  <Users size={15} />
                  <span>Who & Pets</span>
                </button>
              </div>

              <div className="popover-content">
                {activeSegment === "destination" && (
                  <div className="segment-body destination-segment">
                    <label className="segment-label">Where are you headed?</label>
                    <div className="search-input-field-wrap">
                      <Search size={18} className="field-icon" />
                      <input
                        type="text"
                        placeholder="Search city, neighborhood, or stay name..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        autoFocus
                        className="custom-search-input"
                      />
                      {destination && (
                        <button
                          type="button"
                          className="clear-field-btn"
                          onClick={() => setDestination("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="quick-cities-row">
                      <span className="quick-label">Popular:</span>
                      {quickCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className={`city-chip ${destination.toLowerCase() === city.toLowerCase() ? "chip-active" : ""}`}
                          onClick={() => {
                            setDestination(city);
                            setActiveSegment("dates");
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSegment === "dates" && (
                  <div className="segment-body dates-segment">
                    <label className="segment-label">Select dates</label>
                    <div className="dates-inputs-row">
                      <div className="date-field">
                        <span className="date-label-sub">CHECK-IN</span>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="custom-date-input"
                        />
                      </div>
                      <div className="date-field">
                        <span className="date-label-sub">CHECK-OUT</span>
                        <input
                          type="date"
                          min={checkIn || new Date().toISOString().split("T")[0]}
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="custom-date-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSegment === "guests" && (
                  <div className="segment-body guests-segment">
                    <div className="counter-row">
                      <div>
                        <strong>Guests</strong>
                        <p className="sub-hint">Ages 13 and above</p>
                      </div>
                      <div className="counter-actions">
                        <button
                          type="button"
                          className="counter-btn"
                          disabled={guests <= 1}
                          onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        >
                          -
                        </button>
                        <span className="counter-count">{guests}</span>
                        <button
                          type="button"
                          className="counter-btn"
                          disabled={guests >= 16}
                          onClick={() => setGuests((g) => g + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="pets-toggle-row">
                      <div>
                        <strong>Bringing a pet? 🐾</strong>
                        <p className="sub-hint">Only show pet-friendly listings</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={petsAllowed}
                          onChange={(e) => setPetsAllowed(e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="popover-footer">
                <button
                  type="button"
                  className="popover-clear-btn"
                  onClick={handleClearFilters}
                >
                  Clear all
                </button>
                <button
                  type="button"
                  className="popover-submit-btn"
                  onClick={handleSearchSubmit}
                >
                  <Search size={15} />
                  <span>Find Stays</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions & Menu */}
        <div className="navbar-actions" ref={menuRef}>
          {/* Customer: Become a Host link */}
          {isAuthenticated && !isHost && !isAdmin && (
            <Link to="/become-host" className="host-link-btn">
              Airbnb your home
            </Link>
          )}

          {/* Host: Prominent Host Dashboard button */}
          {isAuthenticated && isHost && (
            <Link to="/host/dashboard" className="host-link-btn host-active-btn">
              <LayoutDashboard size={15} style={{ marginRight: "6px" }} />
              Host Dashboard
            </Link>
          )}

          {/* Admin link */}
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className="admin-portal-link">
              <ShieldCheck size={18} />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* User Menu Trigger */}
          <button
            type="button"
            className="user-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-label="User navigation menu"
          >
            <Menu size={18} />
            <div className="user-avatar-circle">
              {user?.avatar ? (
                <img src={user.avatar} alt="User Avatar" className="user-avatar-img" />
              ) : (
                <User size={16} />
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
              {isAuthenticated ? (
                <>
                  <div className="dropdown-user-info">
                    <strong>{user?.name || "User"}</strong>
                    <div className="dropdown-user-email">{user?.email}</div>
                    {isHost && <span className="host-pill-tag">Host Account</span>}
                  </div>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleNav("/profile")}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleNav("/bookings")}
                  >
                    <Briefcase size={16} />
                    <span>My Trips</span>
                  </button>

                  {/* Host Dashboard Link in Dropdown */}
                  {isHost && (
                    <button
                      type="button"
                      className="dropdown-item host-highlight-item"
                      onClick={() => handleNav("/host/dashboard")}
                    >
                      <LayoutDashboard size={16} />
                      <span>Host Dashboard</span>
                    </button>
                  )}

                  {!isHost && !isAdmin && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleNav("/become-host")}
                    >
                      <Home size={16} />
                      <span>Airbnb your home</span>
                    </button>
                  )}

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item logout-item"
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="dropdown-item"
                    style={{ fontWeight: "600" }}
                    onClick={() => handleNav("/login")}
                  >
                    Log in / Sign up
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleNav("/")}
                  >
                    <Compass size={16} />
                    <span>Explore Stays</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;