/* eslint-disable no-unused-vars */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Bed, Bath, Ruler, Heart, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/utils/helper";
import { formatPostDate } from "@/utils/formatters";
import { Separator } from "@/components/ui/separator";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";

function Stat({ icon: Icon, label, value, iconClass = "h-4 w-4", className = "" }) {
  if (value == null) return null;
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Icon className={iconClass} />
      <span>{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function PropertyCard({ item, variant = "grid" }) {
  const { toggleItem, isInWishlist } = useWishlist();
  const propertyId = item._id || item.id;
  const inWishlist = isInWishlist(propertyId);
  
  // Fallbacks theo schema mới
  const imageUrl = item.image || item.media?.[0]?.url || "/images/placeholder.jpg";
  const locationText = item.location || item.address?.fullAddress;
  const beds = item.beds ?? item.rooms?.bedrooms;
  const baths = item.baths ?? item.rooms?.bathrooms;
  const area = item.sqft ?? item.area;
  const priceText = formatPrice(item.price);
  
  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleItem(propertyId);
  };

  const statIconClass = variant === "grid" ? "h-4 w-4" : "h-6 w-6"; // list to hơn
  const statTextClass = variant === "grid" ? "" : "text-base md:text-lg"; // list to hơn
  const statGapClass  = variant === "grid" ? "gap-4" : "gap-6";           // list nới gap

  // Badge: VIP + Featured + purpose (sale/rent)
  const mapPurpose = (p) => {
    if (!p) return null;
    const v = String(p).toLowerCase();
    if (v === "sale") return "For Sale";
    if (v === "rent") return "For Rent";
    return p;
  };
  const badges = [];
  if (item.postType === 'vip') badges.push("VIP");
  badges.push("Featured");
  const purposeLabel = mapPurpose(item.purpose);
  if (purposeLabel) badges.push(purposeLabel);

  return (
    <Card
      className={`py-0 ${
        variant === "list" ? "flex flex-row gap-5 overflow-hidden" : "overflow-hidden group"
      }`}
    >
      {/* Image */}
      <div className={variant === "list" ? "relative w-[200px] md:w-[300px] shrink-0" : "relative"}>
        <Link to={item.href ?? "#"} className="block">
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition"
          />
        </Link>

        {/* Badges */}
        <div className="absolute inset-x-5 top-5 flex flex-wrap gap-2 justify-between items-start">
          <div className="flex flex-wrap gap-2">
            {badges.map((t, idx) => (
              <Badge
                key={`${t}-${idx}`}
                className={`text-md ${
                  t === "VIP" ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold" :
                  t === "Featured" ? "bg-blue-600 text-white" : 
                  "bg-gray-700 text-white"
                } `}
              >
                {t}
              </Badge>
            ))}
          </div>
          
          {/* Heart Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleWishlist}
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110"
          >
            <Heart 
              className={`h-5 w-5 transition-colors ${
                inWishlist 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-700'
              }`}
            />
          </Button>
        </div>

        {/* Location overlay: chỉ giữ cho GRID để không trùng với dòng địa chỉ bên phải */}
        {variant !== "list" && locationText ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full px-3 py-1 text-md text-white bg-black/40 backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1 lg:text-sm">{locationText}</span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <CardContent
        className={variant === "list" ? "flex flex-col justify-between flex-1 py-10 pl-0" : "p-4 pt-0"}
      >
        {variant === "list" ? (
          <>
            {/* Top block: title + stats + location line */}
            <div className="space-y-4">
              <Link
                to={`/properties/${item._id}`}
                className="text-left text-lg font-semibold no-underline hover:underline line-clamp-1"
              >
                {item.title}
              </Link>

             <div className={`flex flex-wrap items-center ${statGapClass}`}>
                <Stat icon={Bed}  label="Beds"  value={beds}  iconClass={statIconClass} className={statTextClass} />
                <Stat icon={Bath} label="Baths" value={baths} iconClass={statIconClass} className={statTextClass} />
                <Stat icon={Ruler} label={item.sqft ? "Sqft" : "Area"} value={area} iconClass={statIconClass} className={statTextClass} />
              </div>

              {locationText && (
                <div className="mt-1 flex items-center gap-2 text-md text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{locationText}</span>
                </div>
              )}

              {item.createdAt && (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatPostDate(item.createdAt)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Bottom row: owner + price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-md gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.ownerInfo?.avatar} alt={item.ownerInfo?.fullName} />
                  <AvatarFallback>{item.ownerInfo?.fullName?.[0] ?? "A"}</AvatarFallback>
                </Avatar>
                {item.ownerInfo?.fullName && (
                  <span className="text-md text-muted-foreground">{item.ownerInfo.fullName}</span>
                )}
              </div>
              {priceText && <div className="text-md font-semibold">{priceText}</div>}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <Link
                to={`/properties/${item._id}`}
                className="text-left text-lg font-semibold no-underline hover:underline line-clamp-1"
              >
                {item.title}
              </Link>
              <div className="flex flex-wrap items-center gap-4">
                <Stat icon={Bed}  label="Beds" value={beds}  iconClass={statIconClass} />
                <Stat icon={Bath} label="Baths" value={baths} iconClass={statIconClass} />
                <Stat icon={Ruler} label={item.sqft ? "Sqft" : "Area"} value={area} iconClass={statIconClass} />
              </div>
              {item.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatPostDate(item.createdAt)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.ownerInfo?.avatar} alt={item.ownerInfo?.fullName} />
                  <AvatarFallback>{item.ownerInfo?.fullName?.[0] ?? "A"}</AvatarFallback>
                </Avatar>
                {item.ownerInfo?.fullName && (
                  <span className="text-md text-muted-foreground">{item.ownerInfo.fullName}</span>
                )}
              </div>
              {priceText && <div className="text-md font-semibold lg:text-lg ">{priceText}</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
