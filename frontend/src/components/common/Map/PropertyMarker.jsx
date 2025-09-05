import React from 'react';
import { Marker, Popup } from 'react-leaflet';

const PropertyMarker = ({ property }) => {
  const { lat, lng, title, price, currency, image, type, purpose } = property;

  const formatPrice = (price, currency) => {
    if (currency === 'VND') {
      return `${(price / 1000000000).toFixed(1)} tỷ VND`;
    }
    return `${price} ${currency}`;
  };

  return (
    <Marker position={[lat, lng]}>
      <Popup>
        <div style={{ width: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{title}</h3>
          {image && (
            <img 
              src={image} 
              alt={title} 
              style={{ width: '100%', height: '100px', objectFit: 'cover', marginBottom: '8px' }} 
            />
          )}
          <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#e74c3c' }}>
            {formatPrice(price, currency)}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            Loại: {type} | Mục đích: {purpose === 'sale' ? 'Bán' : 'Thuê'}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default PropertyMarker;