/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { getWishlistAPI, toggleWishlistAPI } from '@/apis';
import { toast } from 'react-toastify';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useSelector(state => state.user.currentUser);

  // Load wishlist when user logs in
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setItems([]);
    }
  }, [user]);

  // prevent body scroll when wishlist sidebar is open
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }

    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isOpen]);

  // toggle a data attribute on body so we can adjust other global UI (like header z-index)
  React.useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-wishlist-open', 'true');
    } else {
      document.body.removeAttribute('data-wishlist-open');
    }

    return () => document.body.removeAttribute('data-wishlist-open');
  }, [isOpen]);

  // Load wishlist from backend
  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlistAPI();
      
      // Transform backend data to match UI format
      const transformedItems = (response.wishlist?.properties || []).map(property => ({
        id: property._id,
        property: {
          id: property._id,
          name: property.title,
          title: property.title,
          image: property.media?.[0]?.url || '/placeholder.jpg',
          address: property.address?.fullAddress || `${property.address?.ward}, ${property.address?.district}, ${property.address?.province}`,
          price: property.price?.value,
          href: `/properties/${property._id}`
        }
      }));
      
      setItems(transformedItems);
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Toggle property in wishlist (add/remove)
  const toggleItem = async (propertyId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return false;
    }

    try {
      const response = await toggleWishlistAPI(propertyId);
      
      // Transform and update items
      const transformedItems = (response.wishlist?.properties || []).map(property => ({
        id: property._id,
        property: {
          id: property._id,
          name: property.title,
          title: property.title,
          image: property.media?.[0]?.url || '/placeholder.jpg',
          address: property.address?.fullAddress || `${property.address?.ward}, ${property.address?.district}, ${property.address?.province}`,
          price: property.price?.value,
          href: `/properties/${property._id}`
        }
      }));
      
      setItems(transformedItems);
      
      if (response.action === 'added') {
        toast.success('Added to wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
      
      return response.action === 'added';
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      toast.error('Failed to update wishlist');
      return false;
    }
  };

  // Thêm property vào wishlist (legacy support)
  const addItem = async (property) => {
    return await toggleItem(property.id || property._id);
  };

  // Xóa 1 property
  const removeItem = async (id) => {
    return await toggleItem(id);
  };

  // Xóa tất cả
  const clearWishlist = () => {
    // Can call API to clear all if needed
    setItems([]);
    toast.success('Wishlist cleared');
  };

  // Toggle sidebar
  const toggleWishlistSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Check if item is in wishlist
  const isInWishlist = (propertyId) => {
    return items.some(item => item.id === propertyId || item.property.id === propertyId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        addItem,
        removeItem,
        clearWishlist,
        toggleItem,
        isInWishlist,
        isOpen,
        toggleWishlist: toggleWishlistSidebar,
        refetch: loadWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
