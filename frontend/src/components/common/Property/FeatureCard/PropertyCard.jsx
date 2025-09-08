/* eslint-disable no-unused-vars */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";

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
  const price =
    typeof item.price === "number" ? item.price.toLocaleString() : item.price;

  return (
    <Card
      className={`py-0 ${variant === "list" ? "flex gap-5 overflow-hidden" : "overflow-hidden group"}`}
    >
      <div className={variant === "list" ? "relative w-64 shrink-0" : "relative"}>
        <Link to={item.href ?? "#"} className="block">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition"
          />
        </Link>

        {/* Badges */}
        {item.tags?.length ? (
          <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <Badge
                key={t}
                className={
                  t === "Featured"
                    ? "bg-blue-600 text-white text-xl"
                    : "bg-gray-700 text-white text-xl"
                }
              >
                {t}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Location */}
        {item.location ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full px-3 py-1 text-xl text-white">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
        ) : null}
      </div>

      <CardContent
        className={
          variant === "list"
            ? "flex flex-1 flex-col justify-between py-5"
            : "p-5"
        }
      >
        <div className="space-y-3">
          <Link
            to={item.href ?? "#"}
            className="text-left text-2xl font-semibold no-underline hover:no-underline line-clamp-1"
          >
            {item.title}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            {item.beds != null && <Stat icon={Bed} label="Beds" value={item.beds} />}
            {item.baths != null && <Stat icon={Bath} label="Baths" value={item.baths} />}
            {item.sqft && <Stat icon={Ruler} label="Sqft" value={item.sqft} />}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.agent?.avatar} alt={item.agent?.name} />
              <AvatarFallback>{item.agent?.name?.[0] ?? "A"}</AvatarFallback>
            </Avatar>
            <span className="text-xl text-muted-foreground">{item.agent?.name}</span>
          </div>
          {price && <div className="text-xl font-semibold">${price}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
