import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfileApi, updateUserProfileApi } from "../../services/userApi";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Luggage, 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  Home
} from "lucide-react";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfileApi();
      const userData = res.data?.data?.user || res.data?.user || res.data;
      setProfile(userData);
      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
      });
    } catch (err) {
      console.error("Profile load error:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to load user profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });
      const res = await updateUserProfileApi(formData);
      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      
      const stored = localStorage.getItem("airbnb_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem("airbnb_user", JSON.stringify({ ...parsed, ...updatedUser }));
        } catch {}
      }

      setEditing(false);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeHost = () => {
    navigate("/become-host");
  };

  if (loading) {
    return (
      <div className="profile-loading-box">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error-box">
        <AlertCircle size={32} />
        <p>{message.text || "Unable to display profile information."}</p>
      </div>
    );
  }

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Recently joined";

  const isHost = profile.role === "HOST";

  return (
    <div className="profile-container">
      {message.text && (
        <div className={`profile-status-alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-layout">
        {/* Left Sidebar */}
        <aside className="profile-card-aside">
          <div className="profile-avatar-wrapper">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <h2 className="profile-card-name">{profile.name || "User"}</h2>
          <span className={`profile-badge-guest ${isHost ? "host-role" : ""}`}>
            {isHost ? "Verified Host" : "Verified Guest"}
          </span>

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <Calendar size={16} />
              <span>Joined {joinDate}</span>
            </div>
            <div className="profile-meta-item">
              <Luggage size={16} />
              <span>{profile._count?.bookings || 0} Stays booked</span>
            </div>
            {isHost && (
              <div className="profile-meta-item">
                <Home size={16} />
                <span>{profile._count?.properties || 0} Hosted listings</span>
              </div>
            )}
            <div className="profile-meta-item verified-badge">
              <ShieldCheck size={16} />
              <span>Identity Verified</span>
            </div>
          </div>

          {!isHost && (
            <div className="become-host-cta">
              <p>Ready to earn money by renting your place?</p>
              <button 
                type="button" 
                className="btn-become-host" 
                onClick={handleBecomeHost}
              >
                Become a Host
              </button>
            </div>
          )}
        </aside>

        {/* Right Section */}
        <main className="profile-content-main">
          <div className="profile-content-header">
            <div>
              <h1>Personal Information</h1>
              <p>Manage your account credentials and personal information.</p>
            </div>
            {!editing ? (
              <button
                type="button"
                className="profile-btn-edit"
                onClick={() => setEditing(true)}
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                className="profile-btn-cancel"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: profile.name || "",
                    phone: profile.phone || "",
                    bio: profile.bio || "",
                  });
                }}
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="profile-field-group">
              <label>Full Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              ) : (
                <div className="profile-field-static">
                  <User size={16} />
                  <span>{profile.name || "Not specified"}</span>
                </div>
              )}
            </div>

            <div className="profile-field-group">
              <label>Email Address</label>
              <div className="profile-field-static locked">
                <Mail size={16} />
                <span>{profile.email}</span>
                <span className="static-tag">Primary</span>
              </div>
            </div>

            <div className="profile-field-group">
              <label>Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              ) : (
                <div className="profile-field-static">
                  <Phone size={16} />
                  <span>{profile.phone || "No phone number added"}</span>
                </div>
              )}
            </div>

            <div className="profile-field-group">
              <label>About</label>
              {editing ? (
                <textarea
                  name="bio"
                  rows="4"
                  placeholder="Tell hosts or guests a little about yourself."
                  value={formData.bio}
                  onChange={handleChange}
                />
              ) : (
                <p className="profile-bio-text">
                  {profile.bio || "No bio added yet."}
                </p>
              )}
            </div>

            {editing && (
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="profile-btn-save"
                  disabled={saving}
                >
                  <Check size={16} />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}