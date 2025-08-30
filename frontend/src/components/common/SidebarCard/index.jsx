/* eslint-disable no-unused-vars */
"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Grid2X2, List, Bed, Bath, Ruler } from "lucide-react";
import { Link } from "react-router-dom";

import PropertyCard from "../FeatureCard/PropertyCard";

const PROPERTIES = [
  { id: 1, title: "Casa Lomas", price: 2500, beds: 2, baths: 1, sqft: 1200, image: "/images/home/house-1.jpg", tags: ["Featured","For Sale"], location: "Brooklyn Ave", agent: { name: "Arlene", avatar: "/images/avatar/avt1.png" }, href: "/property/1" },
  { id: 2, title: "Casa Verde", price: 3300, beds: 3, baths: 2, sqft: 1400, image: "/images/home/house-2.jpg", tags: ["Featured","For Sale"], location: "California", agent: { name: "John", avatar: "/images/avatar/avt2.png" }, href: "/property/2" },
];

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
        <div className="mt-2 text-sm font-semibold">${p.price.toLocaleString()}</div>
      </div>
    </li>
  );
}

export default function SidebarCard() {
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("default");
  const [showCount, setShowCount] = useState(8);

  const filtered = useMemo(() => {
    let list = [...PROPERTIES];
    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    return list.slice(0, showCount);
  }, [sortBy, showCount]);

  return (
    <section className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex justify-between">
        <h3 className="text-2xl font-bold">Property Listing</h3>
        <div className="flex gap-2">
          <Button variant={view === "grid" ? "default" : "ghost"} onClick={() => setView("grid")}><Grid2X2 className="h-4 w-4" /></Button>
          <Button variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
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
              {filtered.map((p) => <PropertyCard key={p.id} item={p} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((p) => <PropertyCard key={p.id} item={p} variant="list" />)}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            {[1,2,3].map((n) => <Button key={n} variant={n===1?"default":"outline"}>{n}</Button>)}
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
