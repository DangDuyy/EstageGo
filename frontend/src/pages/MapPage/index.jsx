import { FooterBar } from '@/components/common/FooterBar';
import NavBar from '@/components/common/NavBar';
import SidebarCard from '@/components/common/Property/SidebarCard';
import PropertyMap from '@/components/common/Map/initMap.jsx';
import React from 'react';

function MapPage() {

  const mockProperties = [
    {
      _id: "1",
      title: "Căn hộ cao cấp Vinhomes Central Park",
      price: {
        value: 5500000000,
        currency: "VND"
      },
      type: "apartment",
      status: "available",
      purpose: "sale",
      address: {
        location: {
          coordinates: [106.7038, 10.7970] // Vinhomes Central Park
        }
      },
      media: [{
        url: "/images/banner/banner-property-1.jpg"
      }],
      slug: "can-ho-cao-cap-vinhomes-central-park"
    },
    {
      _id: "2", 
      title: "Nhà phố Thảo Điền sang trọng",
      price: {
        value: 12000000000,
        currency: "VND"
      },
      type: "house",
      status: "available", 
      purpose: "sale",
      address: {
        location: {
          coordinates: [106.7441, 10.8007] // Thảo Điền
        }
      },
      media: [{
        url: "/images/banner/banner-property-2.jpg"
      }],
      slug: "nha-pho-thao-dien-sang-trong"
    },
    {
      _id: "3",
      title: "Căn hộ Landmark 81 view sông",
      price: {
        value: 8500000000, 
        currency: "VND"
      },
      type: "apartment",
      status: "available",
      purpose: "rent", 
      address: {
        location: {
          coordinates: [106.7117, 10.7954] // Landmark 81
        }
      },
      media: [{
        url: "/images/banner/banner-property-3.jpg"
      }],
      slug: "can-ho-landmark-81-view-song"
    }
  ];

  return (
    <>
      <NavBar />
      <div style={{ padding: '20px' }}>
        <h1>Bản đồ bất động sản</h1>
        <PropertyMap properties={mockProperties} />
      </div>
      <SidebarCard />
      <FooterBar />
    </>
  );
}

export default MapPage;