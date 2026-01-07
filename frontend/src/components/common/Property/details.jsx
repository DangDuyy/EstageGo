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
import { MapPin, Bed, Bath, Ruler, Star, Play, Phone, Mail, Share, Heart, GitCompare, Printer, House, SlidersHorizontal, Sofa, Hammer, MessageCircle, Calendar } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPropertyDetailsAPI,
  selectCurrentActiveProperty,
  selectActivePropertyStatus,
  selectActivePropertyError
} from "@/redux/activeProperty/activePropertySlice";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { Textarea } from "@/components/ui/textarea";
import { capitalizeFirstLetter, formatPostDate } from "@/utils/formatters";
import { useWishlist } from "@/contexts/WishlistContext";
import { createOrGetConversationAPI, trackActivityAPI, getSimilarPropertiesAPI } from "@/apis";
import { toast } from "react-toastify";
import PropertyCard from "./FeatureCard/PropertyCard";
import { Marker } from "@react-google-maps/api";
import MapContainer from "../GoogleMap/MapContainer";
import { MapsContext } from "../GoogleMap/MapProvider";
import { PropertyDetailMap } from "../GoogleMap/PropertyDetailMap";
import LoanCalculator from "./LoanCalculator";

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
            {images.map((item, i) => {
              const src = typeof item === 'string' ? item : item.url;
              const type = typeof item === 'string' ? 'image' : item.type;
              
              return (
                <CarouselItem key={i}>
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    {type === 'video' ? (
                      <video
                        src={src}
                        controls
                        className="h-full w-full object-contain bg-black"
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={src}
                        alt={`property-${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />

          <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium shadow">
            {current} / {count}
          </div>
        </Carousel>
      </div>

      <div className="mt-3 grid grid-cols-8 gap-2">
        {images.map((item, i) => {
          const src = typeof item === 'string' ? item : item.url;
          const type = typeof item === 'string' ? 'image' : item.type;
          const isActive = current - 1 === i;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleThumbClick(i)}
              className={cn(
                "group overflow-hidden rounded-md border focus:outline-none relative",
                isActive ? "ring-2 ring-primary" : "hover:opacity-90"
              )}
            >
              <div className="aspect-[4/3] w-full bg-muted">
                {type === 'video' ? (
                  <>
                    <video
                      src={src}
                      alt={`thumb-${i + 1}`}
                      className={cn(
                        "h-full w-full object-cover transition pointer-events-none",
                        isActive ? "scale-100" : "group-hover:scale-105"
                      )}
                      loading="lazy"
                    />
                    {/* Video badge on thumbnail */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={src}
                    alt={`thumb-${i + 1}`}
                    className={cn(
                      "h-full w-full object-cover transition",
                      isActive ? "scale-100" : "group-hover:scale-105"
                    )}
                    loading="lazy"
                  />
                )}
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
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const property = useSelector(selectCurrentActiveProperty);
  const propertyStatus = useSelector(selectActivePropertyStatus);
  const propertyError = useSelector(selectActivePropertyError);
  const currentUser = useSelector(selectCurrentUser);
  const { toggleItem, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(propertyId)
  const [startingChat, setStartingChat] = React.useState(false)
  const [similarProperties, setSimilarProperties] = React.useState([])
  const [loadingSimilar, setLoadingSimilar] = React.useState(true)
  const [shareMenuOpen, setShareMenuOpen] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)

  const isLoggedIn = Boolean(currentUser?._id)

  // Handle start chat with owner
  const handleStartChat = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to chat with the owner')
      return
    }

    const ownerId = property?.ownerInfo?._id
    if (!ownerId) {
      toast.error('Owner information not available')
      return
    }

    if (currentUser._id === ownerId) {
      toast.info('This is your property')
      return
    }

    try {
      setStartingChat(true)
      const conversation = await createOrGetConversationAPI(ownerId)

      // Track CONTACT activity for Collaborative Filtering
      // CONTACT has weight 3 in the CF algorithm
      if (propertyId && currentUser._id) {
        trackActivityAPI('CONTACT', propertyId, {
          timestamp: new Date().toISOString(),
          ownerId: ownerId,
          conversationId: conversation._id
        });
      }

      navigate('/dashboard/messages', { state: { conversationId: conversation._id } })
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start conversation')
    } finally {
      setStartingChat(false)
    }
  }

  // loan calculator
  const [loan, setLoan] = React.useState({ total: 10000, down: 3000, months: 12, rate: 5 });
  const monthlyPayment = React.useMemo(() => {
    const principal = Math.max(loan.total - loan.down, 0);
    const r = loan.rate / 100 / 12;
    if (principal <= 0 || loan.months <= 0) return 0;
    if (r === 0) return principal / loan.months;
    return (principal * r) / (1 - Math.pow(1 + r, -loan.months));
  }, [loan]);

  const handleLeadSubmit = () => {
    if (!isLoggedIn) {
      toast.info('Please log in to continue');
      return;
    }
    toast.success('Your request has been submitted');
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Đã sao chép liên kết')
      setShareMenuOpen(false)
      
      // Track SHARE activity
      if (propertyId && currentUser?._id) {
        trackActivityAPI('SHARE', propertyId, {
          timestamp: new Date().toISOString(),
          method: 'copy_link'
        });
      }
    } catch (error) {
      toast.error('Không thể sao chép liên kết')
    }
  }

  const handleGenerateQR = () => {
    setQrOpen(true)
    setShareMenuOpen(false)
    
    // Track SHARE activity
    if (propertyId && currentUser?._id) {
      trackActivityAPI('SHARE', propertyId, {
        timestamp: new Date().toISOString(),
        method: 'qr_code'
      });
    }
  }

  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const descriptionParas = React.useMemo(() => {
    if (!property?.description) return [];
    return String(property.description).split(/\n{2,}|\r?\n/).filter(Boolean);
  }, [property?.description]);

  /**
   * Track view duration for Collaborative Filtering
   * 
   * QUAN TRỌNG: Đây KHÔNG phải là điều kiện để hiển thị recommendations!
   * 
   * Cách hoạt động:
   * - Khi user xem property > 10 giây → gửi VIEW event với weight = 1
   * - Dữ liệu này được lưu vào UserActivity để backend xây dựng ma trận
   * - Backend sử dụng TẤT CẢ interactions (VIEW, CONTACT, WISHLIST_ADD) 
   *   để tìm similar users và tính recommendations
   * - Recommendations được hiển thị khi user truy cập trang /ai/recommendation
   *   (không phụ thuộc vào việc có VIEW >10s hay không)
   * 
   * Trọng số events:
   * - WISHLIST_ADD: weight 5 (ưu tiên cao nhất)
   * - CONTACT: weight 3 (quan tâm nghiêm túc)
   * - VIEW >10s: weight 1 (chỉ xem qua)
   */
  React.useEffect(() => {
    if (!propertyId || !currentUser?._id) return;

    const startTime = Date.now();
    let viewTimer = null;

    // Track VIEW activity only if user views for more than 10 seconds
    // This data is used by backend to build User-Property Preference Matrix
    viewTimer = setTimeout(() => {
      const duration = (Date.now() - startTime) / 1000; // in seconds
      if (duration >= 10) {
        trackActivityAPI('VIEW', propertyId, {
          timestamp: new Date().toISOString(),
          duration: duration
        });
      }
    }, 10000); // 10 seconds

    // Cleanup on unmount or property change
    return () => {
      if (viewTimer) {
        clearTimeout(viewTimer);
      }
    };
  }, [propertyId, currentUser]);

  React.useEffect(() => {
    if (propertyId) {
      dispatch(fetchPropertyDetailsAPI(propertyId));

      // Fetch similar properties
      const fetchSimilar = async () => {
        try {
          setLoadingSimilar(true);
          const result = await getSimilarPropertiesAPI(propertyId, 6);
          setSimilarProperties(result.data || []);
        } catch (error) {
          console.error('Error fetching similar properties:', error);
        } finally {
          setLoadingSimilar(false);
        }
      };

      fetchSimilar();
    }
  }, [dispatch, propertyId]);

  if (propertyStatus === 'failed') {
    return (
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-20">
        <div className="mx-auto max-w-2xl rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 text-sm font-semibold text-primary">Listing unavailable</div>
          <h1 className="text-2xl font-bold mb-3">The property does not exist or has been hidden.</h1>
          <p className="text-muted-foreground mb-6">
            {propertyError || 'The listing may have been deleted, hidden, set to private, or expired. Please return to the listing to continue your search.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/listing/map')}>
              View properties listing
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Home page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    // Skeleton
    return (
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-10">
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

  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`

  const bedrooms = property.rooms?.bedrooms;
  const bathrooms = property.rooms?.bathrooms;
  const area = property.area;
  const addressText =
    // property.address?.fullAddress ||
    [
      property.address?.street,
      property.address?.ward,
      property.address?.district,
      property.address?.province,
      property.address?.country,
    ].filter(Boolean).join(", ");

  const mediaFiles = Array.isArray(property.media) && property.media.length
    ? property.media
        .filter((m) => m?.url)
        .sort((a, b) => {
          // Sắp xếp: image trước, video sau
          if (a.type === 'image' && b.type === 'video') return -1;
          if (a.type === 'video' && b.type === 'image') return 1;
          return 0;
        })
    : [];

  // Nếu không có media nào, dùng default images
  const displayMedia = mediaFiles.length > 0 
    ? mediaFiles 
    : defaultImages.map(url => ({ url, type: 'image' }));

  const [lng, lat] = property.address?.location?.coordinates || [];
  const gmapSrc = (lng != null && lat != null)
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  return (
    <div className="w-full pt-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="container mx-auto px-4 lg:px-8 xl:px-12">
        <div className="flex flex-col gap-4 py-6 md:flex-col md:justify-between">
          <div className="flex justify-between">
            <h1
              className={cn(
                "text-4xl font-bold tracking-tight",
                (property.status === 'sold' || property.status === 'rented') && "text-red-600"
              )}
            >
              {`${property.title} ${property.status === 'sold' ? '(đã bán)' : property.status === 'rented' ? '(đã cho thuê)' : ''}`.trim()}
            </h1>
            <PriceTag
              value={property.price?.value}
              currency={property.price?.currency}
              unit={property.purpose === "rent" ? `/${property.price?.period || "month"}` : ""}
            />
          </div>

          <Separator />

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
                onClick={() => toggleItem(propertyId)}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                className={cn(
                  "rounded-full p-2 hover:bg-muted transition",
                  inWishlist && "bg-red-50 dark:bg-red-950"
                )}
              >
                <Heart className={cn(
                  "h-5 w-5 transition-colors",
                  inWishlist ? "fill-red-500 text-red-500" : ""
                )} />
              </button>

              <button type="button" title="Compare" aria-label="Compare" className="rounded-full p-2 hover:bg-muted transition">
                <GitCompare className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  title="Share"
                  aria-label="Share"
                  className="rounded-full p-2 hover:bg-muted transition"
                  onClick={() => setShareMenuOpen((v) => !v)}
                >
                  <Share className="h-5 w-5" />
                </button>

                {shareMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border bg-card shadow-lg">
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted"
                      onClick={handleCopyLink}
                    >
                      Copy URL
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted border-t"
                      onClick={handleGenerateQR}
                    >
                      Generate QR Code
                    </button>
                  </div>
                )}
              </div>

              <button type="button" title="Print" aria-label="Print" className="rounded-full p-2 hover:bg-muted transition">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-6">
        <ImagesCarousel images={displayMedia} />
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 lg:px-8 xl:px-12 pb-10 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          <section className="space-y-3 border-b pb-6">
            <h3 className="text-xl font-semibold">Description</h3>

            <div className="space-y-3">
              <p
                className={`text-sm whitespace-pre-line transition-all ${!showFullDesc && property?.description?.length > 250
                    ? "line-clamp-3"
                    : ""
                  }`}
              >
                {property?.description}
              </p>


              {property?.description.length > 250 && (
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
                { label: "Posted", value: formatPostDate(property?.createdAt, true) || "-", Icon: Calendar },
                { label: "Bedrooms", value: property?.rooms?.bedrooms ?? "-", Icon: Bed },
                { label: "Bathrooms", value: property?.rooms?.bathrooms ?? "-", Icon: Bath },
                { label: "LivingRooms", value: property?.rooms?.livingrooms ?? "-", Icon: Sofa },
                { label: "Land Size", value: property?.area ? `${property.area} Sqft` : "-", Icon: Ruler },
                { label: "Year Built", value: property?.yearBuilt ?? "-", Icon: Hammer },
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

          {/* Amenities */}
          <section className="space-y-3 border-b pb-6">
            <h3 className="text-xl font-semibold">Amenities</h3>
            <div className="space-y-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {Array.isArray(property.amenities) && property.amenities.length ? (
                property.amenities.map((feat) => {
                  const capitalized = feat
                    .split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  return <div key={feat} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    {capitalized}
                  </div>
                })
              ) : (
                <div className="text-sm text-muted-foreground">No amenities listed.</div>
              )}
            </div>
          </section>

          {/* Map (nếu có toạ độ) */}
          {gmapSrc && (
            <PropertyDetailMap property={property} />
          )}

          {/* Loan Calculator */}
          {property.purpose && property.purpose === 'sale' && <LoanCalculator propertyPrice={property.price.value} />}
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
                const isOwnProperty = isLoggedIn && currentUser?._id === owner._id;

                return (
                  <div className="space-y-4">
                    <div className="flex flex-row items-center space-y-2 space-x-6">
                      <Avatar className="h-20 w-20 flex-shrink-0">
                        {ownerAvatar ? (
                          <AvatarImage src={ownerAvatar} alt={ownerName} />
                        ) : (
                          <AvatarFallback>{ownerName.slice(0, 1)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-lg truncate" title={ownerName}>
                          {ownerName}
                        </div>
                        {owner.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={owner.phone}>
                              {owner.phone}
                            </span>
                          </div>
                        )}
                        {owner.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={owner.email}>
                              {owner.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isOwnProperty && isLoggedIn && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={handleStartChat}
                        disabled={startingChat}
                      >
                        {startingChat ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Starting conversation...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Chat with owner
                          </>
                        )}
                      </Button>
                    )}
                    {!isLoggedIn && (
                      <p className="text-sm text-muted-foreground">
                        Please log in to chat with the owner.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Form for guests */}
              {!isLoggedIn && (
                <div className="space-y-3">
                  <Input placeholder="Your name" />
                  <Input placeholder="ex 0123456789" />
                  <Input placeholder="your@email.com" />
                  <Textarea placeholder="Message" className="min-h-[100px]" />
                  <Button type="button" onClick={handleLeadSubmit} className="w-full rounded-full">
                    Find Properties →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Properties Section */}
      {similarProperties.length > 0 && (
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Similar Properties</h2>
            <p className="text-muted-foreground">You might also be interested in these properties</p>
          </div>

          {loadingSimilar ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarProperties.map(prop => (
                <PropertyCard key={prop._id} item={prop} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share QR modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mã QR chia sẻ</h3>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-muted"
                onClick={() => setQrOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src={qrImg} alt="QR" className="h-48 w-48 rounded-lg border bg-white p-2" />
              <p className="text-sm text-center text-muted-foreground break-words">{shareUrl}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCopyLink}>Sao chép liên kết</Button>
                <Button onClick={() => setQrOpen(false)}>Đóng</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
