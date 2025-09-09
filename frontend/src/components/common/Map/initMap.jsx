import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PropertyMarker from './PropertyMarker';
import { createPropertyMarkers } from '@/utils/helper';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const PropertyMap = ({ properties = [] }) => {
  // Tọa độ trung tâm TP.HCM
  const center = [10.7970, 106.7038];
  
  // Tạo markers từ dữ liệu properties
  const markers = createPropertyMarkers(properties);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Hiển thị markers */}
        {markers.map(marker => (
          <PropertyMarker key={marker.id} property={marker} />
        ))}
      </MapContainer>
    </div>
  );
};

export default PropertyMap;