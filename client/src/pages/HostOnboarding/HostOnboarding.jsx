import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfileApi } from "../../services/userApi";
import { 
  requestHostOnboardingApi, 
  verifyHostOnboardingApi,
  resendHostOnboardingOtpApi 
} from "../../services/hostApi";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Shield,
  Upload,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock
} from "lucide-react";
import "./HostOnboarding.css";

export default function HostOnboarding() {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuth ? useAuth() : { user: null, setUser: () => {} };

  const [loadingUser, setLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    description: "",
    propertyType: "APARTMENT",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    pricePerNight: "",
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    hostPhotoId: "",
    propertyPhotoUrl: "",
  });

  // Flow State
  const [submitting, setSubmitting] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Timer & Resend State
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  // Countdown timer handler
  useEffect(() => {
    if (otpModalOpen) {
      setTimer(60);
      setCanResend(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpModalOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const res = await getUserProfileApi();
        const u = res.data?.data?.user || res.data?.user || res.data;
        setUserProfile(u);
        setFormData((prev) => ({
          ...prev,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "Not provided",
        }));
      } catch (err) {
        console.error("Error loading user info:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoLiveSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // If user is already a host, hostPhotoId is optional since they are already verified
    const isAlreadyHost = authUser?.role === "HOST" || userProfile?.role === "HOST";

    if (!isAlreadyHost && !formData.hostPhotoId.trim()) {
      setErrorMsg("Please provide your Host Photo ID link/URL for initial verification.");
      return;
    }
    if (!formData.propertyPhotoUrl.trim()) {
      setErrorMsg("Please provide the Property Photo link/URL.");
      return;
    }
    if (!formData.zipCode.trim()) {
      setErrorMsg("PIN code is mandatory for location verification.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestHostOnboardingApi(formData);

      // Check if backend bypassed OTP for existing host
      if (res.data?.data?.isAlreadyHost) {
        alert("🎉 Your new stay has been created and is now live!");
        navigate("/host/dashboard");
        return;
      }

      setSuccessMsg(res.data?.message || `Verification OTP sent to ${formData.email}!`);
      setOtpModalOpen(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to process host registration.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg("");
      const res = await verifyHostOnboardingApi(otpCode);
      const updatedUser = res.data?.data?.updatedUser;

      const currentStored = localStorage.getItem("airbnb_user");
      if (currentStored) {
        try {
          const parsed = JSON.parse(currentStored);
          localStorage.setItem(
            "airbnb_user",
            JSON.stringify({ ...parsed, role: "HOST", ...updatedUser })
          );
        } catch {}
      }

      if (setUser) {
        setUser((prev) => ({ ...prev, role: "HOST", ...updatedUser }));
      }

      setOtpModalOpen(false);
      alert("🎉 Verification successful! Your property is now LIVE. Redirecting to Host Dashboard...");
      navigate("/host/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid OTP code entered. Please try again.");
      setCanResend(true); // Allow resending immediately if entered code fails
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await resendHostOnboardingOtpApi();
      setSuccessMsg(res.data?.message || "A fresh verification code has been sent!");
      setOtpCode("");

      // Reset timer
      setTimer(60);
      setCanResend(false);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend code. Please try again.");
      setCanResend(true);
    } finally {
      setResending(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="host-onboard-loader">
        <div className="loader-spinner"></div>
        <p>Preparing host verification...</p>
      </div>
    );
  }

  const isHost = authUser?.role === "HOST" || userProfile?.role === "HOST";

  return (
    <div className="host-onboard-page">
      <div className="host-onboard-header">
        <div className="badge-live">
          <Sparkles size={14} /> Instant Activation
        </div>
        <h1>{isHost ? "List Another Stay" : "Become an Airbnb Host"}</h1>
        <p>
          {isHost
            ? "Provide your property details below to launch your new listing live on Airbnb."
            : "Submit your property details and identity to go live immediately with OTP verification."}
        </p>
      </div>

      {errorMsg && !otpModalOpen && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && !otpModalOpen && (
        <div className="alert-box alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleGoLiveSubmit} className="host-form-card">
        {/* Section 1: Host Verified Identity */}
        <div className="form-section">
          <h3>
            <Shield size={18} /> Host Identity & Account Information
          </h3>
          <p className="section-note">
            Your registered legal credentials are used to sign and lock this hosting agreement.
          </p>

          <div className="fields-grid-2">
            <div className="form-group">
              <label>Host Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>
                Email Address <Lock size={12} />
              </label>
              <div className="input-locked">
                <Mail size={16} />
                <span>{formData.email}</span>
                <span className="pill-locked">Locked</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                Phone Number <Lock size={12} />
              </label>
              <div className="input-locked">
                <Phone size={16} />
                <span>{formData.phone}</span>
                <span className="pill-locked">Verified</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                Host Government Photo ID (Image URL) {isHost && "(Already on file)"}
              </label>
              <input
                type="text"
                name="hostPhotoId"
                placeholder={isHost ? "Verification completed (optional)" : "https://cloudinary.com/... or hosted image URL"}
                value={formData.hostPhotoId}
                onChange={handleChange}
                required={!isHost}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Property Basic Details */}
        <div className="form-section">
          <h3>
            <Home size={18} /> Property Information
          </h3>

          <div className="form-group full-width">
            <label>Listing Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Modern Minimalist Studio near Central Mall"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              rows="3"
              placeholder="Highlight what makes your place special, view, and comforts..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="fields-grid-3">
            <div className="form-group">
              <label>Property Type</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="ROOM">Room</option>
                <option value="HOTEL">Hotel</option>
                <option value="GUESTHOUSE">Guesthouse</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price per Night (₹)</label>
              <input
                type="number"
                name="pricePerNight"
                placeholder="2499"
                value={formData.pricePerNight}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Max Guests</label>
              <input
                type="number"
                name="guests"
                min="1"
                value={formData.guests}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address & PIN Code */}
        <div className="form-section">
          <h3>
            <MapPin size={18} /> Location & Address
          </h3>

          <div className="form-group full-width">
            <label>Street Address</label>
            <input
              type="text"
              name="address"
              placeholder="Flat 402, Sunshine Apartments, Main Road"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="fields-grid-3">
            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" placeholder="Delhi" value={formData.city} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>State</label>
              <input type="text" name="state" placeholder="Delhi" value={formData.state} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Postal PIN Code</label>
              <input
                type="text"
                name="zipCode"
                placeholder="110044"
                maxLength="6"
                value={formData.zipCode}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Property Photo */}
        <div className="form-section">
          <h3>
            <Upload size={18} /> Property Cover Photo
          </h3>

          <div className="form-group full-width">
            <label>Main Property Image (Direct URL)</label>
            <input
              type="text"
              name="propertyPhotoUrl"
              placeholder="https://images.unsplash.com/... or uploaded photo link"
              value={formData.propertyPhotoUrl}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-footer-action">
          <button type="submit" className="btn-go-live" disabled={submitting}>
            {submitting ? "Processing Listing..." : isHost ? "Publish Stay Live" : "Go Live on Airbnb"}
          </button>
        </div>
      </form>

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card">
            <h2>Enter Security Code</h2>
            <p>
              We sent a 6-digit authorization code to <strong>{formData.email}</strong>.
            </p>

            {errorMsg && (
              <div className="alert-box alert-error" style={{ marginBottom: "16px" }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-box alert-success" style={{ marginBottom: "16px" }}>
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                maxLength="6"
                placeholder="• • • • • •"
                className="otp-code-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />

              {/* Timer and Resend Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "14px 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={15} />
                  <span>
                    {timer > 0 ? `Code expires in ${timer}s` : "Code expired"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!canResend || resending}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: canResend && !resending ? "#ff385c" : "#94a3b8",
                    fontWeight: "600",
                    cursor: canResend && !resending ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: 0,
                  }}
                >
                  <RefreshCw size={13} className={resending ? "spin-icon" : ""} />
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </div>

              <div className="otp-modal-buttons">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setOtpModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm"
                  disabled={verifying || otpCode.length !== 6}
                >
                  {verifying ? "Verifying & Going Live..." : "Confirm & Go Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}