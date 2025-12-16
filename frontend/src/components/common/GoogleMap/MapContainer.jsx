// src/maps/components/MapContainer.jsx
import React, { useContext } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { MapsContext } from "./MapProvider";

const centerVN = { lat: 16.0, lng: 108.2 };

const DEFAULT_MAP_OPTIONS = {
  // ❌ Tắt toàn bộ UI mặc định
  disableDefaultUI: true,

  // ✅ Chỉ bật zoom
  zoomControl: true,
  zoomControlOptions: {
    position: window.google?.maps.ControlPosition.RIGHT_BOTTOM
  },

  mapTypeControl: true,
  // mapTypeControlOptions: {
  //   // style: window.google?.maps.MapTypeControlStyle.HORIZONTAL_BAR,
  //   position: window.google?.maps.ControlPosition.TOP_RIGHT,
  //   mapTypeIds: ["roadmap", "hybrid"]
  // },

  // ❌ Tắt các control không cần
  // mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  rotateControl: false,
  scaleControl: false,

  // ❌ Không click POI
  clickableIcons: false,

  // UX mượt
  gestureHandling: "greedy",

  // 🎨 Style map
  styles: [
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export default function MapContainer({
  center = centerVN,
  zoom = 5,
  onLoad,
  style = { height: "600px", width: "100%", cursor: "default" },
  children,
  ...rest
}) {
  const { loaded } = useContext(MapsContext);

  if (!loaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      options={DEFAULT_MAP_OPTIONS}
      onLoad={onLoad}
      {...rest}
    >
      {children}
    </GoogleMap>
  );
}
