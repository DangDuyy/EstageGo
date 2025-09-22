/* eslint-disable no-unused-vars */
"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("default"); // "default" | "asc" | "desc"
  const [show, setShow] = useState("8"); // Select value là string -> ép sang number khi dùng

  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = parseInt(query.get("page") || "1", 10);

  const updateStateData = (res) => {
    setProperties(Array.isArray(res?.properties) ? res.properties : []);
    setTotalProperties(Number(res?.totalProperties || 0));
  };

  // Fetch data theo query string
  useEffect(() => {
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
  }, [location.search]);

  // Tính filtered theo sort + show
  const filtered = useMemo(() => {
    const list = Array.isArray(properties) ? [...properties] : [];

    if (sort === "asc") {
      list.sort((a, b) => getPriceValue(a) - getPriceValue(b));
    } else if (sort === "desc") {
      list.sort((a, b) => getPriceValue(b) - getPriceValue(a));
    }
    const showCount = Number(show) || 8;
    return list.slice(0, showCount);
  }, [properties, sort, show]);

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
          <Select value={show} onValueChange={setShow}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Show: 8" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">Show: 8</SelectItem>
              <SelectItem value="10">Show: 10</SelectItem>
              <SelectItem value="12">Show: 12</SelectItem>
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
        <FiltersPanel />

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

          {/* Pagination (demo) */}
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" size="icon" aria-label="Prev page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3].map((n) => (
              <Button
                key={`page-${n}`}
                variant={n === page ? "default" : "outline"}
              >
                {n}
              </Button>
            ))}
            <Button variant="outline" size="icon" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
