
import React from 'react';

/**
 * CarouselDots Component
 * 
 * @param {number} total - Tổng số ảnh
 * @param {number} current - Index hiện tại (0-based)
 * @param {number} maxDots - Số dots tối đa hiển thị (mặc định: 5)
 */
const CarouselDots = ({ total, current, maxDots = 5 }) => {
  // Không hiển thị nếu chỉ có 1 ảnh
  if (total <= 1) return null;

  // Tính toán dots hiển thị
  const getVisibleDots = () => {
    if (total <= maxDots) {
      return Array.from({ length: total }, (_, i) => i);
    }
    
    if (current <= 2) {
      return [0, 1, 2, 3, 4];
    } else if (current >= total - 3) {
      return [total - 5, total - 4, total - 3, total - 2, total - 1];
    } else {
      return [current - 2, current - 1, current, current + 1, current + 2];
    }
  };

  const visibleDots = getVisibleDots();

  return (
    <div className="flex items-center justify-center gap-1.5 px-1 py-0.5 bg-black/40 backdrop-blur-sm rounded-full absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      {visibleDots.map((index) => {
        const isActive = index === current;
        const distance = Math.abs(index - current);
        
        // Tính toán size và opacity gradient
        let size, opacity, height;
        if (isActive) {
          size = "w-3.5";
          height = "h-2";
          opacity = "bg-white";
        } else if (distance === 1) {
          size = "w-2";
          height = "h-2";
          opacity = "bg-white/80";
        } else if (distance === 2) {
          size = "w-1.5";
          height = "h-1.5";
          opacity = "bg-white/50";
        } else {
          size = "w-1";
          height = "h-1";
          opacity = "bg-white/30";
        }
        
        return (
          <div
            key={index}
            className={`rounded-full transition-all duration-500 ease-in-out ${size} ${height} ${opacity}`}
            style={{
              transitionProperty: 'width, height, opacity, transform',
            }}
          />
        );
      })}
    </div>
  );
};

export default CarouselDots;