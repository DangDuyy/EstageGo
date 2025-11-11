// src/maps/components/MapContainer.jsx
import React, { useContext, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { MapsContext } from "./MapProvider";

export default function MapContainer({ center, zoom = 12, onLoad, style = {height: "100%", width:"100%"}, children }) {
  const { loaded } = useContext(MapsContext)
  const mapRef = useRef(null);

  if (!loaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      onLoad={(map) => {
        mapRef.current = map;
        if (typeof onLoad === "function") onLoad(map);
      }}
    >
      {children}
    </GoogleMap>
  );
}
