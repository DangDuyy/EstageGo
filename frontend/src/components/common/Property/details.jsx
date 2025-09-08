/* eslint-disable no-unused-vars */
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MapPin, Bed, Bath, Ruler, House, Calendar, Car, Download, Star, Play, ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// =================== MOCK DATA ===================
const mockProperty = {
  id: "2297",
  title: "Casa Lomas de Machalí Machas",
  price: 250000,
  priceUnit: "/month",
  address: "145 Brooklyn Ave, California, New York",
  meta: { beds: 3, baths: 2, sqft: 1150 },
  description: [
    "Located around an hour away from Paris, between the Perche and the Iton valley, in a beautiful wooded park bordered by a charming stream, this country property immediately seduces with its bucolic and soothing environment.",
    "An ideal choice for sports and leisure enthusiasts who will be able to take advantage of its swimming pool (11m x 5m), tennis court, gym and sauna."
  ],
  overview: [
    { key: "ID", value: "2297", icon: House },
    { key: "Type", value: "House", icon: Ruler },
    { key: "Garages", value: "1", icon: Car },
    { key: "Bedrooms", value: "2 Rooms", icon: Bed },
    { key: "Bathrooms", value: "2 Rooms", icon: Bath },
    { key: "Land Size", value: "2,000 SqFt", icon: Ruler },
    { key: "Year Built", value: "2024", icon: Calendar },
    { key: "Size", value: "900 SqFt", icon: Ruler },
  ],
  details: [
    { key: "ID:", value: "#1234" },
    { key: "Beds", value: "3" },
    { key: "Price", value: "$7,500" },
    { key: "Year built", value: "2024" },
    { key: "Size", value: "150 sqft" },
    { key: "Type", value: "Villa" },
    { key: "Rooms", value: "9" },
    { key: "Status", value: "For sale" },
    { key: "Baths", value: "3" },
    { key: "Garage", value: "1" },
  ],
  amenities: [
    ["Smoke alarm", "Carbon monoxide alarm", "First aid kit", "Self check-in with lockbox", "Security cameras"],
    ["Hangers", "Bed linens", "Extra pillows & blankets", "Iron", "TV with standard cable"],
    ["Refrigerator", "Microwave", "Dishwasher", "Coffee maker"],
  ],
  map: {
    iframeSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d135905.11693909427!2d106.7009!3d10.7765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1727094281524!5m2!1sen!2s",
    infoLeft: [
      { label: "Address", value: "150 sqft" },
      { label: "City", value: "#1234" },
      { label: "State/county", value: "$7,500" },
    ],
    infoRight: [
      { label: "Postal code", value: "7.328" },
      { label: "Area", value: "7.328" },
      { label: "Country", value: "2024" },
    ],
  },
  floors: [
    {
      title: "First Floor",
      beds: 2,
      baths: 2,
      image: "/images/banner/floor.png",
    },
    {
      title: "Second Floor",
      beds: 2,
      baths: 2,
      image: "/images/banner/floor.png",
    },
  ],
  attachments: [
    { name: "Villa-Document.pdf", href: "#", icon: "/images/file-1.png" },
    { name: "Villa-Blueprint.pdf", href: "#", icon: "/images/file-2.png" },
  ],
  explore360: {
    image: "/images/explore.jpg",
  },
  nearby: {
    left: [
      { label: "School:", value: "0.7 km" },
      { label: "University:", value: "1.3 km" },
      { label: "Grocery center:", value: "0.6 km" },
      { label: "Market:", value: "1.1 km" },
    ],
    right: [
      { label: "Hospital:", value: "0.4 km" },
      { label: "Metro station:", value: "1.8 km" },
      { label: "Gym, wellness:", value: "1.3 km" },
      { label: "River:", value: "2.1 km" },
    ],
  },
  reviews: [
    {
      name: "Floyd Miles",
      date: "August 13, 2024",
      rating: 5,
      avatar: "https://i.pravatar.cc/60?img=12",
      text:
        "It's really easy to use and exactly what I am looking for. A lot of good looking templates & highly customizable.",
      photos: [
        "https://picsum.photos/seed/rev1/141/79",
        "https://picsum.photos/seed/rev2/141/79",
        "https://picsum.photos/seed/rev3/141/79",
      ],
    },
    {
      name: "Kristin Watson",
      date: "August 13, 2024",
      rating: 5,
      avatar: "https://i.pravatar.cc/60?img=5",
      text:
        "Live support is helpful, solved my issue in no time. The layouts are modern and clean.",
      photos: [],
    },
  ],
};

// =================== SMALL UTILS ===================
function PriceTag({ value, unit }) {
  const fmt = new Intl.NumberFormat("en-US").format(value);
  return (
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold">${fmt}</span>
      {unit ? <span className="text-muted-foreground">{unit}</span> : null}
    </div>
  );
}

function Stars({ value = 0 }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < value ? "fill-foreground" : "fill-muted stroke-muted-foreground")}
        />
      ))}
    </div>
  );
}

// =================== CAROUSEL (DEFAULT) ===================
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
      // guard: api.off may not exist in older @embla versions; check before call
      if (api && typeof api.off === "function") api.off("select", onSelect);
    };
  }, [api]);

  const handleThumbClick = React.useCallback(
    (index) => {
      if (api && typeof api.scrollTo === "function") {
        api.scrollTo(index);
      }
    },
    [api]
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Main carousel */}
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

          {/* Counter badge */}
          <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow">
            {current} / {count}
          </div>
        </Carousel>
      </div>

      {/* Thumbnails */}
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

export default function PropertyDetail({
  property = mockProperty,
  ImagesCarousel = PropertyImagesCarousel,
}) {
  // loan calculator state
  const [loan, setLoan] = React.useState({
    total: 10000,
    down: 3000,
    months: 12,
    rate: 5,
  });

  const monthlyPayment = React.useMemo(() => {
    const principal = Math.max(loan.total - loan.down, 0);
    const r = loan.rate / 100 / 12;
    if (principal <= 0 || loan.months <= 0) return 0;
    if (r === 0) return principal / loan.months;
    return (principal * r) / (1 - Math.pow(1 + r, -loan.months));
  }, [loan]);

  const [showFullDesc, setShowFullDesc] = React.useState(false);

  return (
    <div className="w-full">
      {/* Header: title + price + quick meta */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 border-b py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <Bed className="h-4 w-4" /> {property.meta.beds} Beds
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Bath className="h-4 w-4" /> {property.meta.baths} Baths
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Ruler className="h-4 w-4" /> {property.meta.sqft} sqft
              </Badge>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{property.address}</span>
              </div>
            </div>
          </div>
          <PriceTag value={property.price} unit={property.priceUnit} />
        </div>
      </div>

      {/* GALLERY */}
      <div className="container mx-auto px-4 py-6">
        {/* ✅ render component */}
        <ImagesCarousel />
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 pb-10 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(showFullDesc ? property.description : property.description.slice(0, 1)).map((p, i) => (
                <p key={i} className="text-muted-foreground">{p}</p>
              ))}
              <Button variant="link" className="px-0" onClick={() => setShowFullDesc((v) => !v)}>
                {showFullDesc ? "Show less" : "View more"}
              </Button>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {property.overview.map((it) => (
                  <div key={it.key} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <it.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{it.key}</div>
                      <div className="font-medium">{it.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video */}
          <Card>
            <CardHeader>
              <CardTitle>Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-lg border">
                <div className="aspect-video w-full bg-muted" />
                <Button variant="secondary" size="sm" className="absolute left-3 top-3 gap-2">
                  <Play className="h-4 w-4" /> Watch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Property Details grid */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {property.details.map((d) => (
                <div key={d.key} className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">{d.key}</span>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities and features</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {property.amenities.map((col, idx) => (
                <ul key={idx} className="space-y-2">
                  {col.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                      {feat}
                    </li>
                  ))}
                </ul>
              ))}
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Map location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <iframe
                  title="property-map"
                  src={property.map.iframeSrc}
                  className="h-[380px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ul className="space-y-2">
                  {property.map.infoLeft.map((i) => (
                    <li key={i.label} className="flex justify-between text-sm">
                      <span className="font-semibold">{i.label}</span>
                      <span className="text-muted-foreground">{i.value}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2">
                  {property.map.infoRight.map((i) => (
                    <li key={i.label} className="flex justify-between text-sm">
                      <span className="font-semibold">{i.label}</span>
                      <span className="text-muted-foreground">{i.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Floor plans */}
          <Card>
            <CardHeader>
              <CardTitle>Floor plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {property.floors.map((f, idx) => (
                  <AccordionItem key={f.title} value={`floor-${idx}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex w-full items-center justify-between">
                        <span>{f.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {f.beds} Bedroom • {f.baths} Bathroom
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-hidden rounded-lg border">
                        <div className="w-full bg-muted">
                          <img
                            src={f.image}
                            alt={f.title}
                            className="h-auto w-full"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {property.attachments.map((a) => (
                <a
                  key={a.name}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <Download className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{a.name}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Explore 360 (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Explore Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-lg border">
                <div className="aspect-video w-full bg-muted" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border bg-background/70 px-4 py-2 text-sm font-medium shadow">
                    360° Viewer (coming soon)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Calculator */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Calculator</CardTitle>
            </CardHeader>
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
                    ${monthlyPayment.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Guest reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {property.reviews.map((r, idx) => (
                <div key={idx} className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={r.avatar} alt={r.name} />
                    <AvatarFallback>{r.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                    <div className="mt-1"><Stars value={r.rating} /></div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.text}</p>
                    {r.photos?.length ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {r.photos.map((src, i) => (
                          <img key={i} src={src} alt={`review-${i}`} className="h-20 w-full rounded-md object-cover" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline">Save</Button>
              <Button variant="outline">Share</Button>
              <Button variant="outline">Compare</Button>
              <Button>Contact</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule a visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="(+84) ..." />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input placeholder="I am interested in this property..." />
              </div>
              <Button className="w-full">Send request</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
