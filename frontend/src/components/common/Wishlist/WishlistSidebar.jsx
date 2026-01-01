import React from "react";
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/contexts/WishlistContext";

export default function WishlistSidebar() {
  const { items, isOpen, toggleWishlist, removeItem, clearWishlist } = useWishlist();

  if (!isOpen) return null;

  const jsx = (
    <div className="fixed inset-0 z-[9999] flex items-stretch">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/80 backdrop-blur-sm"
        onClick={toggleWishlist}
        aria-hidden="true"
      />

      {/* Sidebar (flush right, full viewport height) */}
  <aside className="fixed right-0 top-0 h-screen w-full max-w-md bg-background shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Wishlist</h2>
            {items.length > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                {items.length}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleWishlist} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">No saved properties</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Save properties you like to view later.
                </p>
              </div>
              <Button onClick={toggleWishlist} variant="outline">
                Continue Browsing
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <Card 
                key={item.id} 
                className={`p-4 hover:bg-muted/30 transition-colors ${
                  !item.isAvailable ? 'opacity-60 bg-muted/50' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={item.property.image}
                      alt={item.property.name || item.property.title}
                      className={`w-20 h-20 object-cover rounded-lg ${
                        !item.isAvailable ? 'grayscale' : ''
                      }`}
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white text-center px-1">
                          {item.status === 'draft' ? 'Draft' : 'Hidden'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {item.property.name || item.property.title}
                    </h4>
                    {item.property.address && (
                      <p className="text-xs text-muted-foreground mt-1">{item.property.address}</p>
                    )}
                    {!item.isAvailable && (
                      <p className="text-xs text-red-600 font-semibold mt-1">Unavailable</p>
                    )}
                    {item.property.price != null && (
                      <p className={`text-sm font-semibold mt-2 ${
                        item.isAvailable ? 'text-price' : 'text-gray-400'
                      }`}>
                        ${Number(item.property.price).toLocaleString()}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      {item.property.href && (
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline"
                          disabled={!item.isAvailable}
                        >
                          <a href={item.property.href}>View Detail</a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive h-auto p-0 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-6 space-y-3">
            <Button variant="outline" onClick={toggleWishlist} className="w-full">
              Continue Browsing
            </Button>
            <Button
              variant="ghost"
              onClick={clearWishlist}
              className="w-full text-destructive"
            >
              Clear Wishlist
            </Button>
          </div>
        )}
      </aside>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(jsx, document.body);
  }

  return jsx;
}
