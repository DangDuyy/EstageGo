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

  const onLoad = async (map) => {
    mapRef.current = map;

    // 1️⃣ Load Level 0 + 1
    const level0 = await fetch("/geojson/gadm41_VNM_0.json").then((r) => r.json());
    const level1 = await fetch("/geojson/gadm41_VNM_1.json").then((r) => r.json());
    map.data.addGeoJson(level0);
    map.data.addGeoJson(level1);

    // 2️⃣ Giữ màu mặc định Google Maps
    map.data.setStyle({ fillOpacity: 0, strokeWeight: 1 });

    // 3️⃣ Hover highlight
    map.data.addListener("mouseover", (e) => {
      map.data.overrideStyle(e.feature, { strokeWeight: 2, strokeColor: "#4285F4" });
    });
    map.data.addListener("mouseout", () => {
      map.data.revertStyle();
    });

    // 4️⃣ Click Level 1 → load Level 2
    map.data.addListener("click", async (e) => {
      const provinceId = e.feature.getProperty("GID_1");
      await loadLevel2(provinceId);

      // Zoom chính xác
      const bounds = new window.google.maps.LatLngBounds();
      extendBoundsForFeature(e.feature, bounds);
      map.fitBounds(bounds);
    });
  };

  const loadLevel2 = async (provinceId) => {
    // Remove old Level 2
    level2Features.forEach((f) => mapRef.current.data.remove(f));
    setLevel2Features([]);

    const data = await fetch("/geojson/gadm41_VNM_2.json").then((r) => r.json());
    // Chỉ lấy các huyện của tỉnh đang click
    const features = mapRef.current.data.addGeoJson(data).filter(f => f.getProperty("GID_1") === provinceId);
    setLevel2Features(features);

    // Click Level 2 → load Level 3
    mapRef.current.data.addListener("click", async (e) => {
      const districtId = e.feature.getProperty("ID_2");
      if (!districtId) return;
      await loadLevel3(districtId);

      // Zoom chính xác
      const bounds = new window.google.maps.LatLngBounds();
      extendBoundsForFeature(e.feature, bounds);
      mapRef.current.fitBounds(bounds);
    });
  };

  const loadLevel3 = async (districtId) => {
    // Remove old Level 3
    level3Features.forEach((f) => mapRef.current.data.remove(f));
    setLevel3Features([]);

    const data = await fetch("/geojson/gadm41_VNM_3.json").then((r) => r.json());
    const features = mapRef.current.data.addGeoJson(data).filter(f => f.getProperty("ID_2") === districtId);
    setLevel3Features(features);
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
