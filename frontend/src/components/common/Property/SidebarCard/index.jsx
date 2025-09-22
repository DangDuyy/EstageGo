/* eslint-disable no-unused-vars */
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bath, Bed, ChevronLeft, ChevronRight, Grid2X2, List, Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import PropertyCard from "../FeatureCard/PropertyCard";
import { fetchAllPropertiesAPI } from "@/apis";
import { Skeleton } from "@/components/ui/skeleton";

const LATEST = [
  { id: 3, title: "Casa Azul", beds: 1, baths: 1, sqft: 900, price: 1800, image: "/images/home/house-3.jpg", href: "/property/3" },
];

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
          <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.beds}</span>
          <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.baths}</span>
          <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{p.sqft}</span>
        </div>
        <div className="mt-2 text-sm font-semibold">${Number(p.price ?? 0).toLocaleString()}</div>
      </div>
    </li>
  );
}

export default function SidebarCard() {
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("default");
  const [showCount, setShowCount] = useState(8);

  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);   // ✅ loading riêng

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = parseInt(query.get("page") || "1", 10);

  const updateStateData = (res) => {
    setProperties(res?.properties ?? []);
    setTotalProperties(res?.totalProperties ?? 0);
  };

  // ✅ Fetch trong useEffect + AbortController để tránh setState khi unmount
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

  // ✅ Tính toán filtered từ state sẵn có
  const filtered = useMemo(() => {
    const list = Array.isArray(properties) ? [...properties] : [];

    if (sortBy === "price-asc") list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortBy === "price-desc") list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

    return list.slice(0, showCount);
  }, [properties, sortBy, showCount]);

  if (loading) {
    return <Skeleton className="h-[20px] w-[140px] rounded-full mx-4 my-6" />;
  }

  return (
    <section className="container mx-auto px-40 py-10">
      {/* Header */}
      <div className="mb-6 flex justify-between">
        <h3 className="text-3xl font-bold">Property Listing</h3>
        <div className="flex gap-2">
          <Button variant={view === "grid" ? "default" : "ghost"} onClick={() => setView("grid")}>
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              {/* Filters (demo) */}
              <Input placeholder="Search keyword" />
            </CardContent>
          </Card>

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
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            {[1, 2, 3].map((n) => (
              <Button key={`page-${n}`} variant={n === page ? "default" : "outline"}>
                {n}
              </Button>
            ))}
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

      </div>
    </section>
  );
}
