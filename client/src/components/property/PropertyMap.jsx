import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon paths in Vite/Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to dynamically re-center map when coordinates change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function PropertyMap({
  latitude,
  longitude,
  title,
  city,
  country = "India",
}) {
  // Fallback coordinates (e.g. New Delhi center) if listing doesn't have exact lat/lng
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  const lat = latitude ? Number(latitude) : defaultLat;
  const lng = longitude ? Number(longitude) : defaultLng;
  const position = [lat, lng];

  return (
    <div className="property-map-wrapper">
      <div style={{ height: "420px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #dddddd", zIndex: 0 }}>
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <div style={{ padding: "4px" }}>
                <strong>{title || "Property Location"}</strong>
                <p style={{ margin: "4px 0 0 0", color: "#717171", fontSize: "12px" }}>
                  {city ? `${city}, ${country}` : country}
                </p>
              </div>
            </Popup>
          </Marker>
          <RecenterMap center={position} />
        </MapContainer>
      </div>
      <p style={{ marginTop: "12px", fontSize: "14px", color: "#717171" }}>
        Exact location information is provided after a booking is confirmed.
      </p>
    </div>
  );
}