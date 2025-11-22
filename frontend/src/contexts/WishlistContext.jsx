/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { getWishlistAPI, toggleWishlistAPI, trackActivityAPI, clearAllWishlistAPI, removeFromWishlistAPI } from '@/apis';
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
      
      // Track wishlist activity for recommendations
      if (user?._id) {
        const eventType = response.action === 'added' ? 'WISHLIST_ADD' : 'WISHLIST_REMOVE';
        trackActivityAPI(eventType, propertyId, {
          timestamp: new Date().toISOString()
        });
      }
      
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
  const clearWishlist = async () => {
    if (!user) {
      toast.error('Please login to clear wishlist');
      return;
    }

    if (items.length === 0) {
      toast.info('Wishlist is already empty');
      return;
    }

    try {
      setLoading(true);
      
      // Store items before clearing to track activities
      const itemsToRemove = [...items];
      
      // Try to use clearAll API first
      try {
        const response = await clearAllWishlistAPI();
        
        // If API returns success, verify wishlist is cleared by reloading
        if (response.success || response.wishlist) {
          // Clear local state immediately
          setItems([]);
          
          // Track activity for each removed item (non-blocking)
          if (user?._id) {
            itemsToRemove.forEach(item => {
              const propertyId = item.id || item.property?.id;
              if (propertyId) {
                trackActivityAPI('WISHLIST_REMOVE', propertyId, {
                  timestamp: new Date().toISOString(),
                  action: 'clear_all'
                }).catch(err => console.warn('Failed to track activity:', err));
              }
            });
          }
          
          // Reload wishlist to ensure sync with backend
          await loadWishlist();
          
          toast.success('Wishlist cleared successfully');
          return;
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || '';
        const errorStatus = error.response?.status;
        const isNotFoundError = errorStatus === 404 || 
                                errorMessage.includes('not found') || 
                                errorMessage.includes('No matching document');
        
        // If clearAll API doesn't exist (404) or has "not found" error, fallback to removing items one by one
        if (errorStatus === 404 && !errorMessage.includes('No matching document')) {
          // API endpoint doesn't exist (404 without specific error message)
          console.log('ClearAll API not available, removing items one by one...');
        } else {
          // API exists but encountered an error (e.g., "No matching document")
          console.warn('ClearAll API error, trying to remove items one by one:', error);
        }
        
        // Always fallback to removing items one by one when clearAll fails
        // Remove items one by one, skip errors for non-existent items
        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const item of itemsToRemove) {
          const propertyId = item.id || item.property?.id;
          if (!propertyId) continue;
          
          try {
            await removeFromWishlistAPI(propertyId);
            successCount++;
            
            // Track activity for successfully removed item
            if (user?._id) {
              trackActivityAPI('WISHLIST_REMOVE', propertyId, {
                timestamp: new Date().toISOString(),
                action: 'clear_all'
              }).catch(err => console.warn('Failed to track activity:', err));
            }
          } catch (err) {
            const errMessage = err.response?.data?.message || err.message || '';
            const isItemNotFound = err.response?.status === 404 || 
                                 errMessage.includes('not found') || 
                                 errMessage.includes('No matching document');
            
            if (isItemNotFound) {
              // Item already removed or doesn't exist - skip it
              skippedCount++;
              console.log(`Item ${propertyId} not found or already removed, skipping...`);
            } else {
              // Other errors - log but continue
              errorCount++;
              console.warn(`Failed to remove item ${propertyId}:`, err);
            }
          }
        }
        
        // Clear local state
        setItems([]);
        
        // Reload to sync with backend (this will remove any orphaned items)
        await loadWishlist();
        
        // Show appropriate message
        if (successCount === 0 && skippedCount > 0) {
          toast.success('Wishlist cleared (items were already removed)');
        } else if (errorCount > 0 && successCount === 0) {
          toast.error('Failed to clear wishlist. Please try again.');
        } else if (skippedCount > 0 || errorCount > 0) {
          toast.success(`Wishlist cleared (${successCount} removed, ${skippedCount + errorCount} skipped)`);
        } else {
          toast.success(`Wishlist cleared successfully (${successCount} items removed)`);
        }
        return;
      }
    } catch (error) {
      console.error('Clear wishlist error:', error);
      
      // Reload wishlist to show actual state
      await loadWishlist();
      
      // Check error message for more context
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('No matching document')) {
        // If it's a "not found" error, items might already be removed
        // Clear local state and reload
        setItems([]);
        await loadWishlist();
        toast.success('Wishlist cleared (some items were already removed)');
      } else {
        toast.error(`Failed to clear wishlist: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
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
