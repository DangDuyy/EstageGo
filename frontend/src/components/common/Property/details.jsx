/* eslint-disable no-unused-vars */
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MapPin, Bed, Bath, Ruler, Star, Play, Phone, Mail, Share, Heart, GitCompare, Printer, House, SlidersHorizontal, Sofa, Hammer } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPropertyDetailsAPI,
  selectCurrentActiveProperty
} from "@/redux/activeProperty/activePropertySlice";
import { Textarea } from "@/components/ui/textarea";
import { capitalizeFirstLetter } from "@/utils/formatters";
import { useWishlist } from "@/contexts/WishlistContext";

/* ============ Small utils ============ */
function PriceTag({ value, currency, unit }) {
  // Hiển thị VND theo locale VN, các currency khác rơi về en-US
  const isVND = currency === "VND";
  const fmt = new Intl.NumberFormat(isVND ? "vi-VN" : "en-US", {
    style: "currency",
    currency: currency || (isVND ? "VND" : "USD"),
    maximumFractionDigits: 0
  }).format(value ?? 0);

  return (
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold">{fmt}</span>
      {unit ? <span className="text-muted-foreground">{unit}</span> : null}
    </div>
  );
}

// function Stars({ value = 0 }) {
//   return (
//     <div className="flex">
//       {Array.from({ length: 5 }).map((_, i) => (
//         <Star
//           key={i}
//           className={cn("h-4 w-4", i < value ? "fill-foreground" : "fill-muted stroke-muted-foreground")}
//         />
//       ))}
//     </div>
//   );
// }

/* ============ Gallery ============ */
const defaultImages = [
  "/images/blog/blog-lg-1.jpg",
  "/images/blog/blog-lg-2.jpg",
  "/images/blog/blog-lg-3.jpg",
  "/images/blog/blog-lg-4.jpg",
  "/images/blog/blog-lg-5.jpg",
];

function PropertyImagesCarousel({ images = defaultImages, className }) {
  const [api, setApi] = React.useState();
  const [current, setCurrent] = React.useState(1);
  const [count, setCount] = React.useState(images.length);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", onSelect);
    return () => {
      if (api && typeof api.off === "function") api.off("select", onSelect);
    };
  }, [api]);

  const handleThumbClick = React.useCallback(
    (index) => api?.scrollTo?.(index),
    [api]
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="relative overflow-hidden rounded-lg border">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {images.map((src, i) => (
              <CarouselItem key={i}>
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={src}
                    alt={`property-${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />

          <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow">
            {current} / {count}
          </div>
        </Carousel>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {images.map((src, i) => {
          const isActive = current - 1 === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleThumbClick(i)}
              className={cn(
                "group overflow-hidden rounded-md border focus:outline-none",
                isActive ? "ring-2 ring-primary" : "hover:opacity-90"
              )}
            >
              <div className="aspect-[4/3] w-full bg-muted">
                <img
                  src={src}
                  alt={`thumb-${i + 1}`}
                  className={cn(
                    "h-full w-full object-cover transition",
                    isActive ? "scale-100" : "group-hover:scale-105"
                  )}
                  loading="lazy"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Page ============ */
export default function PropertyDetail({ ImagesCarousel = PropertyImagesCarousel }) {
  const dispatch = useDispatch();
  const { propertyId } = useParams();
  const property = useSelector(selectCurrentActiveProperty);
  const { toggleWishlist } = useWishlist()

  // loan calculator
  const [loan, setLoan] = React.useState({ total: 10000, down: 3000, months: 12, rate: 5 });
  const monthlyPayment = React.useMemo(() => {
    const principal = Math.max(loan.total - loan.down, 0);
    const r = loan.rate / 100 / 12;
    if (principal <= 0 || loan.months <= 0) return 0;
    if (r === 0) return principal / loan.months;
    return (principal * r) / (1 - Math.pow(1 + r, -loan.months));
  }, [loan]);

  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const descriptionParas = React.useMemo(() => {
    if (!property?.description) return [];
    return String(property.description).split(/\n{2,}|\r?\n/).filter(Boolean);
  }, [property?.description]);

  React.useEffect(() => {
    if (propertyId) dispatch(fetchPropertyDetailsAPI(propertyId));
  }, [dispatch, propertyId]);

  if (!property) {
    // Skeleton
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-3">
              <div className="h-40 rounded bg-muted" />
              <div className="h-40 rounded bg-muted" />
            </div>
            <div className="lg:col-span-4 space-y-3">
              <div className="h-32 rounded bg-muted" />
              <div className="h-60 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bedrooms = property.rooms?.bedrooms;
  const bathrooms = property.rooms?.bathrooms;
  const area = property.area;
  const addressText =
    property.address?.fullAddress ||
    [
      property.address?.street,
      property.address?.ward,
      property.address?.district,
      property.address?.province,
      property.address?.country,
    ].filter(Boolean).join(", ");

  const mediaImages = Array.isArray(property.media) && property.media.length
    ? property.media
        .filter((m) => m?.url && (m.type === "image" || !m.type))
        .map((m) => m.url)
    : defaultImages;

  const [lng, lat] = property.address?.location?.coordinates || [];
  const gmapSrc = (lng != null && lat != null)
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  return (
    <div className="w-full pt-20">
      {/* Header */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 py-6 md:flex-col md:justify-between">
          <div className="flex justify-between">
            <h1 className="text-4xl font-bold tracking-tight">{property.title}</h1>
            <PriceTag
              value={property.price?.value}
              currency={property.price?.currency}
              unit={property.purpose === "rent" ? `/${property.price?.period || "month"}` : ""}
            />
          </div>

          <Separator/>

          <div className="flex flex-row justify-between items-center">
            <div className="mt-2 flex flex-wrap items-center gap-10 text-sm text-muted-foreground">
              <span>
                <h1 className="text-neutral-900 text-md py-2">Features</h1>
                {typeof bedrooms === "number" && (
                  <Badge variant="secondary" className="gap-1">
                    <Bed className="h-4 w-4" /> {bedrooms} Beds
                  </Badge>
                )}
                {typeof bathrooms === "number" && (
                  <Badge variant="secondary" className="gap-1">
                    <Bath className="h-4 w-4" /> {bathrooms} Baths
                  </Badge>
                )}
                {typeof area === "number" && (
                  <Badge variant="secondary" className="gap-1">
                    <Ruler className="h-4 w-4" /> {area} m²
                  </Badge>
                )}
              </span>
              <span>
                <h1 className="text-neutral-900 text-md py-2">Location</h1>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-1">{addressText}</span>
                </div>
              </span>
            </div>
            <div className="flex flex-row gap-4 text-muted-foreground">
              <button
                type="button"
                onClick={toggleWishlist}
                title="Open wishlist"
                aria-label="Open wishlist"
                className="rounded-full p-2 hover:bg-muted transition"
              >
                <Heart className="h-5 w-5" />
              </button>

              <button type="button" title="Compare" aria-label="Compare" className="rounded-full p-2 hover:bg-muted transition">
                <GitCompare className="h-5 w-5" />
              </button>

              <button type="button" title="Share" aria-label="Share" className="rounded-full p-2 hover:bg-muted transition">
                <Share className="h-5 w-5" />
              </button>

              <button type="button" title="Print" aria-label="Print" className="rounded-full p-2 hover:bg-muted transition">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 py-6">
        <ImagesCarousel images={mediaImages} />
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 pb-10 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          <section className="space-y-3 border-b pb-6">
            <h3 className="text-xl font-semibold">Description</h3>
            <div className="space-y-3">
              {(showFullDesc ? descriptionParas : descriptionParas.slice(0, 1)).map((p, i) => (
                <p key={i} className="text-muted-foreground">{p}</p>
              ))}
              {descriptionParas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc(v => !v)}
                  className="text-primary hover:underline text-sm"
                >
                  {showFullDesc ? "Show less" : "View More"}
                </button>
              )}
            </div>
          </section>
          <section className="space-y-4 border-b pb-6">
            <h3 className="text-xl font-semibold">Overview</h3>
            {(() => {
              const items = [
                { label: "ID", value: property?._id?.slice(-4) || "-", Icon: House },
                { label: "Type", value: property?.type || "-", Icon: SlidersHorizontal },
                { label: "Bedrooms", value: property?.rooms?.bedrooms ?? "-", Icon: Bed },
                { label: "Bathrooms", value: property?.rooms?.bathrooms ?? "-", Icon: Bath },
                { label: "LivingRooms", value: property?.rooms?.livingrooms ?? "-", Icon: Sofa},
                { label: "Land Size", value: property?.area ? `${property.area} Sqft` : "-", Icon: Ruler },
                { label: "Year Built", value: property?.yearBuilt ?? "-" , Icon: Hammer },
                { label: "Size", value: property?.area ? `${property.area} Sqft` : "-", Icon: Ruler },
              ]

              return (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      {it.Icon ? <it.Icon className="h-5 w-5 text-primary" /> : <span className="h-5 w-5" />}
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</div>
                        <div className="text-sm font-medium truncate">
                          {capitalizeFirstLetter(String(it.value))}
                        </div>                      
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>

          {/* Map (nếu có toạ độ) */}
          {gmapSrc && (
            <Card>
              <CardHeader><CardTitle>Map location</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <iframe
                    title="property-map"
                    src={gmapSrc}
                    className="h-[380px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          <Card>
            <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.isArray(property.amenities) && property.amenities.length ? (
                property.amenities.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    {feat}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No amenities listed.</div>
              )}
            </CardContent>
          </Card>

          {/* Video placeholder */}
          <Card>
            <CardHeader><CardTitle>Video</CardTitle></CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-lg border">
                <div className="aspect-video w-full bg-muted" />
                <Button variant="secondary" size="sm" className="absolute left-3 top-3 gap-2">
                  <Play className="h-4 w-4" /> Watch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loan Calculator */}
          <Card>
            <CardHeader><CardTitle>Loan Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-total">Total Amount</Label>
                  <Input
                    id="loan-total"
                    type="number"
                    value={loan.total}
                    onChange={(e) => setLoan((s) => ({ ...s, total: Number(e.target.value) }))}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-down">Down Payment</Label>
                  <Input
                    id="loan-down"
                    type="number"
                    value={loan.down}
                    onChange={(e) => setLoan((s) => ({ ...s, down: Number(e.target.value) }))}
                    placeholder="3000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-months">Amortization (months)</Label>
                  <Input
                    id="loan-months"
                    type="number"
                    value={loan.months}
                    onChange={(e) => setLoan((s) => ({ ...s, months: Number(e.target.value) }))}
                    placeholder="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-rate">Interest rate (%)</Label>
                  <Input
                    id="loan-rate"
                    type="number"
                    value={loan.rate}
                    onChange={(e) => setLoan((s) => ({ ...s, rate: Number(e.target.value) }))}
                    placeholder="5"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button className="w-full sm:w-auto" onClick={() => null}>Calculate</Button>
                <div className="text-sm">
                  <span className="font-semibold">Monthly Payment: </span>
                  <span className="font-bold text-primary">
                    {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(monthlyPayment)}{" "}
                    {property.price?.currency === "VND" ? "VND" : property.price?.currency || ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Contact Sellers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                  {/* Owner Info */}
                  {(() => {
                    const owner = property.ownerInfo || {};
                    const ownerName = owner.fullName || "Seller name";
                    const ownerAvatar = owner.avatar || null;

                    return (
                      <div className="flex flex-row items-center space-y-2 space-x-6">
                        <Avatar className="h-20 w-20">
                          {ownerAvatar ? (
                            <AvatarImage src={ownerAvatar} alt={ownerName} />
                          ) : (
                            <AvatarFallback>{ownerName.slice(0, 1)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium text-lg">{ownerName}</div>
                          {owner.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{owner.phone}</span>
                            </div>
                          )}
                          {owner.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{owner.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

              {/* Form */}
              <div className="space-y-3">
                <Input placeholder="Your name" />
                <Input placeholder="ex 0123456789" />
                <Input placeholder="your@email.com" />
                <Textarea placeholder="Message" className="min-h-[100px]" />
                <Button className="w-full rounded-full">
                  Find Properties →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
