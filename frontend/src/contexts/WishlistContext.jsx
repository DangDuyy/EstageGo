/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false); 

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

  // Thêm property vào wishlist
  const addItem = (property) => {
    setItems((prev) => {
      // tránh trùng
      if (prev.some((it) => it.id === property.id)) return prev;
      return [...prev, property];
    });
  };

  // Xóa 1 property
  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Xóa tất cả
  const clearWishlist = () => {
    setItems([]);
  };

  // Toggle sidebar
  const toggleWishlist = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearWishlist,
        isOpen,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
