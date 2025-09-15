import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "react-router-dom";
import { Bath, Bed, ChevronLeft, ChevronRight, Grid2X2, List, Ruler } from "lucide-react";
import { fetchAllPropertiesAPI } from "@/apis";
import PropertyCard from "@/components/common/Property/FeatureCard/PropertyCard";
import Filter from "./filter";
import NavBar from '@/components/common/NavBar';

function PropertiesMap() {
    const [sortBy, setSortBy] = useState("default");
    const [showCount, setShowCount] = useState(8);

    // ✅ Khởi tạo mảng rỗng để có thể spread/map an toàn
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

    return (
        <>
            <NavBar />
            <div className="w-full pt-20 h-screen flex flex-col fixed inset-0 overflow-hidden">
                {/* Filter - cố định ở trên */}
                <div className="flex-shrink-0 z-10">
                    <Filter />
                </div>

                {/* Main content area - chiếm phần còn lại của screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-14 min-h-0">
                    {/* Map - cố định, không scroll */}
                    <div className="lg:col-span-8 h-full">
                        <iframe
                            className="w-full h-full"
                            src="https://www.google.com/maps?q=10.762622,106.660172&z=14&output=embed"
                            allowFullScreen
                            loading="lazy">
                        </iframe>
                    </div>

                    {/* Properties list - có thể scroll */}
                    <div className="lg:col-span-6 p-4 shadow-lg shadow-black/90 flex flex-col h-full overflow-y-auto">
                        {/* Main Header */}
                        <div className="mb-6 flex flex-col">
                            <h3 className="text-xl font-medium">Real Estate & Homes For Sale</h3>
                            <span className="text-base">{totalProperties} results</span>
                        </div>
                        {/* Content area - có thể scroll */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {filtered.map((p, idx) => (
                                    <PropertyCard
                                        key={p.id ?? p._id ?? p.slug ?? p.href ?? idx}
                                        item={p}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Pagination - cố định ở dưới */}
                        <div className="flex-shrink-0 p-4 bg-white border-t">
                            <div className="flex justify-center gap-2">
                                <Button variant="outline" size="icon">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {[1, 2, 3].map((n) => (
                                    <Button key={`page-${n}`} variant={n === page ? "default" : "outline"}>
                                        {n}
                                    </Button>
                                ))}
                                <Button variant="outline" size="icon">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PropertiesMap;