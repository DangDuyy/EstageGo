// Tạo marker cho căn hộ trên map
export function createPropertyMarker(property) {
  const coords = property?.address?.location?.coordinates;
  if (!coords || coords.length !== 2) return null;
  
  const [lng, lat] = coords; // GeoJSON: [lng, lat]
  return {
    id: property._id,
    lat: lat,
    lng: lng,
    title: property.title,
    price: property.price?.value,
    currency: property.price?.currency,
    type: property.type,
    status: property.status,
    purpose: property.purpose,
    image: property.media?.[0]?.url,
    slug: property.slug
  };
}

// Tạo nhiều markers từ danh sách properties
export function createPropertyMarkers(properties = []) {
  return properties
    .map(createPropertyMarker)
    .filter(marker => marker !== null);
}

export function formatPrice(price) {
  if (price == null) return null;
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  if (typeof price === "string") return price;
  if (typeof price === "object") {
    const { value, currency, period } = price;
    const symbolMap = { USD: "$", VND: "₫", EUR: "€" };
    const symbol = symbolMap[currency] ?? (currency ? `${currency} ` : "");
    const num = Number(value ?? 0);
    return `${symbol}${num.toLocaleString()}${period ? `/${period}` : ""}`;
  }
  return String(price);
}