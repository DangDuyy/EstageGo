import React from "react";
import { Marker } from "@react-google-maps/api";

export default function MarkerLayer({ items = [], onMarkerClick }) {
  return (
    <>
      {items.map(item => (
        <Marker
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => onMarkerClick?.(item)}
          // icon or advanced marker customization here
        />
      ))}
    </>
  );
}
