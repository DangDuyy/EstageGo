/* eslint-disable no-unused-vars */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/utils/helper";
import { Separator } from "@/components/ui/separator"

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-8 w-8" />
      <span>{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function PropertyCard({ item, variant = "grid" }) {
  // Fallbacks theo schema mới
  const imageUrl = item.image || item.media?.[0]?.url || "/images/placeholder.jpg";
  const locationText = item.location || item.address?.fullAddress;
  const beds = item.beds ?? item.rooms?.bedrooms;
  const baths = item.baths ?? item.rooms?.bathrooms;
  const area = item.sqft ?? item.area;
  const priceText = formatPrice(item.price);

  return (
    <Card
      className={`py-0 ${
        variant === "list" ? "flex gap-5 overflow-hidden" : "overflow-hidden group"
      }`}
    >
      {/* Image */}
      <div className={variant === "list" ? "relative w-[280px] md:w-[320px] shrink-0" : "relative"}>
        <Link to={item.href ?? "#"} className="block">
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition"
          />
        </Link>

        {/* Badges */}
        {(() => {
          const mapPurpose = (p) => {
            if (!p) return null;
            const v = String(p).toLowerCase();
            if (v === "sale") return "For Sale";
            if (v === "rent") return "For Rent";
            return p; // fallback nếu sau này có giá trị khác
          };

          const badges = ["Featured"];
          const purposeLabel = mapPurpose(item.purpose);
          if (purposeLabel) badges.push(purposeLabel);

          return (
            <div className="absolute inset-x-5 top-5 flex flex-wrap gap-2">
              {badges.map((t, idx) => (
                <Badge
                  key={`${t}-${idx}`}
                  className={t === "Featured" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}
                >
                  {t}
                </Badge>
              ))}
            </div>
          );
        })()}


        {/* Location */}
        {locationText ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full px-3 py-1 text-md text-white">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{locationText}</span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <CardContent
        className={variant === "list" ? "flex flex-row items-center flex-1 p-5" : "p-5 pt-0"}
      >
        {/* Left: title + stats */}
        <div className="flex-1 space-y-3">
          <Link
            to={item.href ?? "#"}
            className="text-left text-xl font-semibold no-underline hover:underline line-clamp-1"
          >
            {item.title}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Stat icon={Bed} label="Beds" value={beds} />
            <Stat icon={Bath} label="Baths" value={baths} />
            <Stat icon={Ruler} label={item.sqft ? "Sqft" : "Area"} value={area} />
          </div>
        </div>

        <Separator />

        {/* Right: agent/owner + price */}
        <div className="mt-4 flex justify-between items-center gap-3 md:mt-4">
          {/* Nếu chưa có agent, phần này sẽ graceful degrade */}
          <div className="flex flex-row items-center gap-3">
            <Avatar className="h-10 w-10">
                        <AvatarImage src={item.ownerInfo?.avatar} alt={item.ownerInfo?.fullName} />
                        <AvatarFallback>{item.ownerInfo?.fullName?.[0] ?? "A"}</AvatarFallback>
                      </Avatar>
                      {item.ownerInfo?.fullName && (
                        <span className="text-sm text-muted-foreground">{item.ownerInfo.fullName}</span>
            )}
          </div>
          {priceText && <div className="ml-4 text-lg font-semibold">{priceText}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
