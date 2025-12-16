"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Bath,
  Bed,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Ruler,
} from "lucide-react";

import PropertyCard from "../FeatureCard/PropertyCard";
import { fetchAllPropertiesAPI } from "@/apis";
import FiltersPanel from "../filter";

const LATEST = [
  {
    id: 3,
    title: "Casa Azul",
    beds: 1,
    baths: 1,
    sqft: 900,
    price: 1800,
    image: "/images/home/house-3.jpg",
    href: "/property/3",
  },
];

// Helpers
function getPriceValue(p) {
  if (typeof p?.price === "number") return p.price;
  if (p?.price && typeof p.price?.value === "number") return p.price.value;
  return 0;
}

function getPropertyPriority(p) {
  const now = new Date();
  const isVip = p?.postType === "vip";
  const isBoostActive = p?.boostExpiresAt && new Date(p.boostExpiresAt) > now;

  if (isVip && isBoostActive) return 4; // VIP + Active Boost
  if (isBoostActive) return 2; // Boost only
  if (isVip) return 1; // VIP only
  return 0; // Normal
}

function LatestItem({ p }) {
  return (
    <li className="flex gap-3">
      <Link to={p.href} className="block h-16 w-24 overflow-hidden rounded-md">
        <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
      </Link>
      <div className="flex-1">
        <Link to={p.href} className="text-sm font-medium hover:underline line-clamp-1">
          {p.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {p.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {p.baths}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {p.sqft}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold">
          ${Number(getPriceValue(p)).toLocaleString()}
        </div>
      </div>
    </li>
  );
}

export default function SidebarCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  
  const page = parseInt(query.get("page") || "1", 10);
  const itemsPerPage = parseInt(query.get("itemsPerPage") || "8", 10);
  
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("default"); // "default" | "asc" | "desc"

  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if this is from AI search
  const aiSearchData = location.state?.isAISearch ? {
    properties: location.state?.properties || [],
    query: location.state?.query || '',
    filters: location.state?.filters || {}
  } : null;

  const updateStateData = (res) => {
    setProperties(Array.isArray(res?.properties) ? res.properties : [])
    setTotalProperties(Number(res?.totalProperties || 0))
  }

  // Fetch data theo query string hoặc sử dụng AI search results
  useEffect(() => {
    // Nếu có AI search data, sử dụng nó thay vì fetch
    if (aiSearchData) {
      setProperties(aiSearchData.properties);
      setTotalProperties(aiSearchData.properties.length);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    fetchAllPropertiesAPI(location.search, { signal: controller.signal })
      .then((res) => {
        if (!active) return;
        updateStateData(res);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Fetch properties error:", err);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [location.search, aiSearchData]);

  // Tính filtered theo sort
  const filtered = useMemo(() => {
    const list = Array.isArray(properties) ? [...properties] : [];

    if (sort === "asc") {
      list.sort((a, b) => getPriceValue(a) - getPriceValue(b));
    } else if (sort === "desc") {
      list.sort((a, b) => getPriceValue(b) - getPriceValue(a));
    } else {
      // Default sort: priority (VIP+Boost > Boost > VIP > Normal), then by bumpedAt, then by createdAt
      list.sort((a, b) => {
        const priorityA = getPropertyPriority(a);
        const priorityB = getPropertyPriority(b);
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }
        
        // If same priority, sort by bumpedAt (newest boost first)
        const bumpedAtA = a?.bumpedAt ? new Date(a.bumpedAt).getTime() : 0;
        const bumpedAtB = b?.bumpedAt ? new Date(b.bumpedAt).getTime() : 0;
        if (bumpedAtA !== bumpedAtB) {
          return bumpedAtB - bumpedAtA;
        }
        
        // Then by createdAt (newest first)
        const createdAtA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdAtB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdAtB - createdAtA;
      });
    }
    
    // Backend handles pagination
    return list;
  }, [properties, sort]);
  
  // Calculate total pages
  const totalPages = totalProperties > 0 ? Math.ceil(totalProperties / itemsPerPage) : 0;
  
  // Navigate to different page
  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(location.search);
    params.set("page", String(newPage));
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  // Change items per page
  const changeItemsPerPage = (value) => {
    const params = new URLSearchParams(location.search);
    params.set("itemsPerPage", value);
    params.set("page", "1");
    navigate(`${location.pathname}?${params.toString()}`);
  };
  
  // Get page numbers array for display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }
    
    return pages;
  };

  // Receive instant results from FiltersPanel (keyword typing)
  const handleInstantResults = (res) => {
    updateStateData(res)
  }

  if (loading) {
    return (
      <section className="container mx-auto px-40 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-[36px] w-[220px] rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[120px] rounded-md" />
            <Skeleton className="h-9 w-[180px] rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </aside>
          <div className="lg:col-span-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-40 py-10">
      {/* AI Search Banner */}
      {aiSearchData && (
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <p className="font-semibold text-primary">Kết quả tìm kiếm AI</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Câu tìm kiếm:</strong> "{aiSearchData.query}"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tìm thấy <strong>{aiSearchData.properties.length}</strong> bất động sản phù hợp
          </p>
          {/* Optional: Show filters used */}
          {aiSearchData.filters && Object.keys(aiSearchData.filters).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:underline">
                Xem bộ lọc đã dùng
              </summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                {JSON.stringify(aiSearchData.filters, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
      
      {/* Header */}
      <div className="mb-6 flex justify-between">
        <h3 className="text-3xl font-bold">Property Listing</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>

          {/* Show Select */}
          <Select value={String(itemsPerPage)} onValueChange={changeItemsPerPage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">Show: 8</SelectItem>
              <SelectItem value="10">Show: 10</SelectItem>
              <SelectItem value="12">Show: 12</SelectItem>
              <SelectItem value="20">Show: 20</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by (Default)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Sort by (Default)</SelectItem>
              <SelectItem value="asc">Price Ascending</SelectItem>
              <SelectItem value="desc">Price Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Sidebar */}
      <aside className="lg:col-span-4">
        <FiltersPanel onInstantResults={handleInstantResults} />

        <div className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h5 className="mb-4 text-base font-semibold">Latest Properties</h5>
              <ul className="space-y-4">
                {LATEST.map((p) => <LatestItem key={p.id} p={p} />)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </aside>

        {/* Main content */}
        <div className="lg:col-span-8">
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((p, idx) => (
                <PropertyCard
                  key={p.id ?? p._id ?? p.slug ?? p.href ?? idx}
                  item={p}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((p, idx) => (
                <PropertyCard
                  key={p.id ?? p._id ?? p.slug ?? p.href ?? idx}
                  item={p}
                  variant="list"
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} ({totalProperties} total)
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  aria-label="Prev page"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {getPageNumbers().map((n, idx) => (
                  n === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 flex items-center">...</span>
                  ) : (
                    <Button
                      key={`page-${n}`}
                      variant={n === page ? "default" : "outline"}
                      onClick={() => goToPage(n)}
                    >
                      {n}
                    </Button>
                  )
                ))}
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  aria-label="Next page"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
