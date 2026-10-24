import React from "react";
import { useNavigate } from "react-router-dom";
import "./EmptyState.css";

export default function EmptyState({
  title = "No results found",
  subtitle = "Try adjusting your search criteria or explore other popular destinations.",
  actionLabel = "Explore stays",
  actionPath = "/",
  onAction,
  icon,
}) {
  const navigate = useNavigate();

  const handleActionClick = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">
        {icon || (
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )}
      </div>

      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-subtitle">{subtitle}</p>

      {actionLabel && (
        <button
          type="button"
          className="empty-state-action-btn primary"
          onClick={handleActionClick}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}