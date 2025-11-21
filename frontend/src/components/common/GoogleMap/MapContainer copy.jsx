// src/maps/components/MapContainer.jsx
import React, { useContext, useRef, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { MapsContext } from "./MapProvider";

const centerVN = { lat: 16.0, lng: 108.2 };

export default function MapContainer({
  center = centerVN,
  zoom = 5,
  style = { height: "600px", width: "100%" },
  children,
}) {
  const { loaded } = useContext(MapsContext);
  const mapRef = useRef(null);
  const [level2Features, setLevel2Features] = useState([]);
  const [level3Features, setLevel3Features] = useState([]);

  if (!loaded) return <div>Loading map...</div>;

  // Helper: traverse geometry để extend bounds
  const extendBoundsForFeature = (feature, bounds) => {
    const geom = feature.getGeometry();

    const recurse = (g) => {
      if (g instanceof window.google.maps.Data.Point) {
        bounds.extend(g.get());
      } else if (
        g instanceof window.google.maps.Data.LineString ||
        g instanceof window.google.maps.Data.LinearRing
      ) {
        g.getArray().forEach((latlng) => bounds.extend(latlng));
      } else if (g instanceof window.google.maps.Data.Polygon) {
        g.getArray().forEach((r) => r.getArray().forEach((latlng) => bounds.extend(latlng)));
      } else if (g instanceof window.google.maps.Data.MultiPolygon) {
        g.getArray().forEach((p) =>
          p.getArray().forEach((r) => r.getArray().forEach((latlng) => bounds.extend(latlng)))
        );
      } else if (g instanceof window.google.maps.Data.GeometryCollection) {
        g.getArray().forEach((sub) => recurse(sub));
      }
    };

    recurse(geom);
  };

  return (
    <GoogleMap
      mapContainerStyle={style}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
    >
      {children}
    </GoogleMap>
  );
}
