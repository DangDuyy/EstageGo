// src/maps/components/MapContainer.jsx
import React, { useContext } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { MapsContext } from "./MapProvider";

const centerVN = { lat: 16.0, lng: 108.2 };

const mapOptions = {
  styles: [
    {
      featureType: "poi",      // tất cả điểm quan tâm
      elementType: "all",
      stylers: [{ visibility: "off" }] // tắt hiển thị
    }
  ],
  disableDefaultUI: false, // giữ UI mặc định nếu muốn
};

export default function MapContainer({
  center = centerVN,
  zoom = 5,
  onLoad,
  style = { height: "600px", width: "100%", cursor: "default" },
  children,
}) {
  const { loaded } = useContext(MapsContext);

  if (!loaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={onLoad}
    >
      {children}
    </GoogleMap>
  );
}
