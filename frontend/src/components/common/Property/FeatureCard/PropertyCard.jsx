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
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import CarouselDots from "../../Dots/CarouselDots";

/** Small stat component (Beds, Baths, Sqft...) */
function Stat({ icon: Icon, label, value, iconClass = "h-4 w-4", className = "" }) {
  if (value == null) return null;

  return (
    <div className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Icon className={iconClass} />
      <span className="hidden sm:inline">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function PropertyCard({ item, variant = "grid", className }) {
  const { toggleItem, isInWishlist } = useWishlist();

  // Basic property fields
  const propertyId = item._id || item.id;
  const inWishlist = isInWishlist(propertyId);

  const imageUrl = item.image || item.media?.[0]?.url || "/images/placeholder.jpg";
  const locationText = item.location || item.address?.fullAddress;

  const beds = item.beds ?? item.rooms?.bedrooms;
  const baths = item.baths ?? item.rooms?.bathrooms;
  const area = item.sqft ?? item.area;
  const priceText = formatPrice(item.price);

  // Wishlist toggle
  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleItem(propertyId);
  };

  // Classes that differ between grid vs list
  const statIconClass = variant === "grid" ? "h-4 w-4" : "h-6 w-6";
  const statTextClass = variant === "grid" ? "" : "text-base md:text-lg";
  const statGapClass = variant === "grid" ? "gap-4" : "gap-6";

  // Badges (VIP, Featured, Sale/Rent)
  const mapPurpose = (p) => {
    if (!p) return null;
    const v = p.toLowerCase();
    if (v === "sale") return "For Sale";
    if (v === "rent") return "For Rent";
    return p;
  };

  const badges = [];
  if (item.postType === "vip") badges.push("VIP");
  badges.push("Featured");
  const purposeLabel = mapPurpose(item.purpose);
  if (purposeLabel) badges.push(purposeLabel);


  const [api, setApi] = useState()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!api) {
      return
    }
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <Card
      className={cn(
        "py-0 rounded-md",
        variant === "list"
          ? "flex flex-row gap-5 overflow-hidden"
          : "w-full h-full overflow-hidden group gap-0",
        className
      )}
    >
      {/* Image section */}
      <div
        className={
          variant === "list"
            ? "relative w-[200px] md:w-[300px] shrink-0"
            : "relative"
        }
      >
        {/* <Link to={item.href ?? `/properties/${item._id}`} className="block"> */}
        {/* <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div> */}

        <div className="relative">
          <Carousel setApi={setApi} className="w-full relative group">
            <CarouselContent>
              {item.media.map((media, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={media.url}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Prev button */}
            {item.media.length > 1 && (
              <CarouselPrevious
                className="
        absolute left-2 top-1/2 -translate-y-1/2
        !opacity-0 group-hover:!opacity-100
        transition duration-300
      "
              />
            )}

            {/* Next button */}
            {item.media.length > 1 && (
              <CarouselNext
                className="
        absolute right-2 top-1/2 -translate-y-1/2
        !opacity-0 group-hover:!opacity-100
        transition duration-300
      "
              />
            )}
          </Carousel>

          {/* DOTS */}
          {/* {item.media.length > 1 && <div className="flex items-center justify-center p-0.5 px-1 m-0 gap-1.5 bg-black/40 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
            {item.media.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${i === (current - 1) ? "h-2 w-2 bg-white" : "bg-gray-300"
                  }`}
              />
            ))}
          </div>
          } */}

          {item.media.length > 1 && 
            <CarouselDots total = {item.media.length} current = {current - 1} />
          }
        </div>



        {/* </Link> */}

        {/* Badges + Wishlist button */}
        <div className="absolute inset-x-5 top-5 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {badges.map((t, idx) => (
              <Badge
                key={`${t}-${idx}`}
                className={cn(
                  "text-sm",
                  t === "VIP"
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold"
                    : t === "Featured"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                )}
              >
                {t}
              </Badge>
            ))}
          </div>

          {/* Heart button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleWishlist}
            className="h-6 w-6 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                inWishlist ? "fill-red-500 text-red-500" : "text-gray-700"
              )}
            />
          </Button>
        </div>

        {/* Location overlay only for grid */}
        {/* {variant !== "list" && locationText && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full px-3 py-1 text-md text-white bg-black/40 backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1 lg:text-sm">{locationText}</span>
          </div>
        )} */}
      </div>

      {/* Content */}
      <CardContent
        className={
          variant === "list"
            ? "flex flex-col justify-between flex-1 py-10 pl-0"
            : "p-3"
        }
      >
        {variant === "list" ? (
          // ------------------------- LIST VIEW -------------------------
          <>
            {/* Top info */}
            <div className="space-y-4">
              <Link
                to={`/properties/${item._id}`}
                className="text-left text-lg font-semibold hover:underline line-clamp-1"
              >
                {item.title}
              </Link>

              {/* Stats */}
              <div className={cn("flex flex-wrap items-center", statGapClass)}>
                <Stat icon={Bed} label="Beds" value={beds} iconClass={statIconClass} className={statTextClass} />
                <Stat icon={Bath} label="Baths" value={baths} iconClass={statIconClass} className={statTextClass} />
                <Stat icon={Ruler} label={item.sqft ? "Sqft" : "Area"} value={area} iconClass={statIconClass} className={statTextClass} />
              </div>

              {/* Location */}
              {locationText && (
                <div className="mt-1 flex items-center gap-2 text-md text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{locationText}</span>
                </div>
              )}

              {/* Date */}
              {item.createdAt && (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatPostDate(item.createdAt)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              {/* Owner */}
              <div className="flex items-center text-md gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.ownerInfo?.avatar} />
                  <AvatarFallback>{item.ownerInfo?.fullName?.[0] ?? "A"}</AvatarFallback>
                </Avatar>
                {item.ownerInfo?.fullName && (
                  <span className="text-md text-muted-foreground">{item.ownerInfo.fullName}</span>
                )}
              </div>

              {/* Price */}
              {priceText && <div className="text-md font-semibold">{priceText}</div>}
            </div>
          </>
        ) : (
          // ------------------------- GRID VIEW -------------------------
          <>
            <div>
              {/* Title */}
              <Link
                to={`/properties/${item._id}`}
                className="text-left text-lg font-semibold hover:underline line-clamp-1"
              >
                {item.title}
              </Link>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4">
                <Stat icon={Bed} label="Beds" value={beds} iconClass={statIconClass} />
                <Stat icon={Bath} label="Baths" value={baths} iconClass={statIconClass} />
                <Stat icon={Ruler} label={item.sqft ? "Sqft" : "Area"} value={area} iconClass={statIconClass} />
              </div>

              <div className="flex items-center gap-2 rounded-full">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1 text-sm">{locationText}</span>
              </div>

              {/* Date */}
              {/* {item.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatPostDate(item.createdAt)}</span>
                </div>
              )} */}
            </div>

            <Separator className="my-4" />

            {/* Bottom Section */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.ownerInfo?.avatar} />
                  <AvatarFallback>{item.ownerInfo?.fullName?.[0] ?? "A"}</AvatarFallback>
                </Avatar>
                {item.ownerInfo?.fullName && (
                  <span className="text-sm text-muted-foreground">{item.ownerInfo.fullName}</span>
                )}
              </div>

              {priceText && <div className="text-md font-semibold">{priceText}</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
