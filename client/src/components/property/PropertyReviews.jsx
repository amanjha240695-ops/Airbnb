import React from "react";
import "./PropertyReviews.css";

const CATEGORY_SCORES = [
  { name: "Cleanliness", score: "5.0", icon: "✨" },
  { name: "Accuracy", score: "4.9", icon: "✓" },
  { name: "Check-in", score: "4.9", icon: "🔑" },
  { name: "Communication", score: "5.0", icon: "💬" },
  { name: "Location", score: "4.9", icon: "🗺️" },
  { name: "Value", score: "5.0", icon: "🏷️" },
];

const GUEST_TAGS = [
  { label: "Cleanliness", count: 6, icon: "🧼" },
  { label: "Location", count: 6, icon: "📍" },
  { label: "Comfort", count: 3, icon: "🛋️" },
  { label: "Hospitality", count: 6, icon: "🎁" },
  { label: "Accuracy", count: 3, icon: "✅" },
  { label: "Quiet", count: 2, icon: "🎧" },
];

const FALLBACK_REVIEWS = [
  {
    id: "r1",
    user: {
      name: "Rohit Verma",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    },
    rating: 5,
    createdAt: "September 2026",
    comment:
      "Absolutely wonderful stay! The photos don't even do justice to how scenic and peaceful this place is. Spotless cleanliness and the host was very attentive.",
  },
  {
    id: "r2",
    user: {
      name: "Sneha Patel",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    },
    rating: 5,
    createdAt: "August 2026",
    comment:
      "One of the best Airbnb experiences we've had. Fast WiFi, fully equipped kitchen, and super comfortable beds. Would love to come back again!",
  },
];

// High-fidelity Laurel Branch SVG
const LaurelBranch = ({ flip = false }) => (
  <svg
    viewBox="0 0 100 160"
    className={`laurel-svg ${flip ? "flip" : ""}`}
    aria-hidden="true"
  >
    <path
      d="M50,150 C40,110 30,70 50,10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M48,135 C30,132 20,120 22,108 C32,110 42,122 48,135 Z" fill="currentColor" />
    <path d="M44,110 C24,106 14,94 18,80 C28,84 38,96 44,110 Z" fill="currentColor" />
    <path d="M42,82 C20,76 12,62 18,48 C28,54 36,68 42,82 Z" fill="currentColor" />
    <path d="M44,54 C26,46 20,32 30,20 C38,28 42,42 44,54 Z" fill="currentColor" />
    <path d="M50,22 C42,12 40,2 50,0 C54,8 54,16 50,22 Z" fill="currentColor" />
    {/* Inner leaves */}
    <path d="M52,125 C66,120 72,110 68,98 C60,102 54,114 52,125 Z" fill="currentColor" />
    <path d="M48,96 C64,90 70,78 64,66 C56,72 50,84 48,96 Z" fill="currentColor" />
    <path d="M46,68 C60,60 64,48 58,38 C52,44 48,56 46,68 Z" fill="currentColor" />
  </svg>
);

export default function PropertyReviews({ reviews = [], avgRating = 5.0 }) {
  const displayReviews = reviews && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
  const ratingValue = Number(avgRating) || 5.0;

  if (ratingValue < 4.0) return null;

  return (
    <div className="reviews-section-container">
      {/* 1. Custom Aman Signature Trophy Badge */}
      <div className="custom-trophy-hero">
        <div className="trophy-seal-emblem">
          <div className="laurel-frame">
            <LaurelBranch />
            <div className="seal-center">
              <span className="seal-rating-score">{ratingValue.toFixed(1)}</span>
              <span className="seal-stars">★★★★★</span>
            </div>
            <LaurelBranch flip />
          </div>

          <div className="curator-badge-pill">
            <span className="curator-badge-icon">👑</span>
            <span className="curator-badge-text">Curated & Engineered by <strong>Aman Kumar Jha</strong></span>
            <span className="curator-badge-check">✓</span>
          </div>
        </div>

        <h2 className="custom-trophy-title">Premier Guest Favorite</h2>
        <p className="custom-trophy-subtitle">
          Handpicked top 1% accommodation meeting the rigorous architectural, cleanliness, and guest hospitality standards set by Aman’s platform.
        </p>
      </div>

      {/* 2. Rating Breakdown Columns */}
      <div className="rating-metrics-row">
        <div className="metric-col overall-metric">
          <span className="metric-label">Overall rating</span>
          <div className="rating-bars-mini">
            <div className="bar-row">
              <span>5</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: "96%" }}></div></div>
            </div>
            <div className="bar-row">
              <span>4</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: "4%" }}></div></div>
            </div>
            <div className="bar-row">
              <span>3</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: "0%" }}></div></div>
            </div>
            <div className="bar-row">
              <span>2</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: "0%" }}></div></div>
            </div>
            <div className="bar-row">
              <span>1</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: "0%" }}></div></div>
            </div>
          </div>
        </div>

        {CATEGORY_SCORES.map((cat, i) => (
          <div key={i} className="metric-col">
            <span className="metric-label">{cat.name}</span>
            <span className="metric-score">{cat.score}</span>
            <span className="metric-icon">{cat.icon}</span>
          </div>
        ))}
      </div>

      {/* 3. Guests Mention Tag Pills */}
      <div className="guests-mention-section">
        <h4 className="guests-mention-title">Guests mention</h4>
        <div className="mention-pills">
          {GUEST_TAGS.map((tag, idx) => (
            <div key={idx} className="mention-pill">
              <span className="pill-icon">{tag.icon}</span>
              <span className="pill-label">{tag.label}</span>
              <span className="pill-count">{tag.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Customer Review Cards Grid */}
      <div className="customer-reviews-grid">
        {displayReviews.map((r, idx) => (
          <div key={r.id || idx} className="review-card">
            <div className="reviewer-header">
              <img
                src={
                  r.user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                }
                alt={r.user?.name || "Guest"}
                className="reviewer-avatar"
              />
              <div>
                <h5 className="reviewer-name">{r.user?.name || "Verified Guest"}</h5>
                <p className="reviewer-date">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "Recent stay"}
                </p>
              </div>
            </div>
            <div className="reviewer-stars">{"★".repeat(r.rating || 5)}</div>
            <p className="reviewer-comment">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}