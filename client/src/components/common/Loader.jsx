import React from "react";
import { Home } from "lucide-react";
import "./Loader.css";

export const Loader = ({ fullScreen = false }) => {
  return (
    <div className={`app-loader-container ${fullScreen ? "fullscreen-loader" : ""}`}>
      <div className="loader-brand-wrapper">
        <Home size={38} className="loader-logo-icon" />
        <span className="loader-logo-text">airbnb</span>
      </div>
      <div className="loader-progress-track">
        <div className="loader-progress-bar" />
      </div>
    </div>
  );
};

export default Loader;