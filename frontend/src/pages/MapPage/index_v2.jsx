import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAllPropertiesAPI } from "@/apis";
import PropertyCard from "@/components/common/Property/FeatureCard/PropertyCard";
import Filter from "./filter";
import NavBar from '@/components/common/NavBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ITEMS_PER_PAGE } from "@/utils/constants";

function PropertiesMap() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    
    const page = parseInt(query.get("page") || "1", 10);
    const itemsPerPage = parseInt(query.get("itemsPerPage") || String(DEFAULT_ITEMS_PER_PAGE), 10);

    const [sortBy] = useState("default");

    // ✅ Khởi tạo mảng rỗng để có thể spread/map an toàn
    const [properties, setProperties] = useState([]);
    const [totalProperties, setTotalProperties] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const updateStateData = (res) => {
        setProperties(res?.properties ?? []);
        setTotalProperties(res?.totalProperties ?? 0);
    };

    // ✅ Fetch trong useEffect + AbortController để tránh setState khi unmount
    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setIsLoading(true);
        fetchAllPropertiesAPI(location.search, { signal: controller.signal })
            .then((res) => {
                if (!active) return;
                updateStateData(res);
                
                // ✅ Nếu page hiện tại > totalPages thực tế, redirect về trang cuối
                const actualTotalPages = Math.ceil((res?.totalProperties ?? 0) / itemsPerPage);
                if (actualTotalPages > 0 && page > actualTotalPages) {
                    const params = new URLSearchParams(location.search);
                    params.set("page", String(actualTotalPages));
                    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
                }
            })
            .catch((err) => {
                if (err?.name !== "AbortError") {
                    console.error("Fetch properties error:", err);
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [location.search, page, itemsPerPage, navigate, location.pathname]);

    // ✅ Tính toán filtered từ state sẵn có
    const filtered = useMemo(() => {
        const list = Array.isArray(properties) ? [...properties] : [];

        if (sortBy === "price-asc") list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        if (sortBy === "price-desc") list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

        return list;
    }, [properties, sortBy]);

    // Tính tổng số trang - nếu không có properties thì totalPages = 0
    const totalPages = totalProperties > 0 ? Math.ceil(totalProperties / itemsPerPage) : 0;

    // Hàm navigate đến trang khác
    const goToPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        const params = new URLSearchParams(location.search);
        params.set("page", String(newPage));
        navigate(`${location.pathname}?${params.toString()}`);
    };

    // Hàm thay đổi items per page
    const changeItemsPerPage = (value) => {
        const params = new URLSearchParams(location.search);
        params.set("itemsPerPage", value);
        params.set("page", "1"); // Reset về trang 1
        navigate(`${location.pathname}?${params.toString()}`);
    };

    // Tạo array các số trang hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Luôn hiển thị trang đầu
            pages.push(1);
            
            // Tính toán range xung quanh current page
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            
            // Thêm ... nếu cần
            if (start > 2) pages.push("...");
            
            // Thêm các trang giữa
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            // Thêm ... nếu cần
            if (end < totalPages - 1) pages.push("...");
            
            // Luôn hiển thị trang cuối
            if (totalPages > 1) pages.push(totalPages);
        }
        
        return pages;
    };

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
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-medium">Real Estate & Homes For Sale</h3>
                                <span className="text-base">{totalProperties} results</span>
                            </div>
                            
                            {/* Items per page selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Show:</span>
                                <Select value={String(itemsPerPage)} onValueChange={changeItemsPerPage}>
                                    <SelectTrigger className="w-20 h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">8</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="12">12</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Content area - có thể scroll */}
                        <div className="flex-1 relative">
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                        <p className="text-sm text-gray-600">Loading properties...</p>
                                    </div>
                                </div>
                            )}
                            
                            {!isLoading && filtered.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {filtered.map((p, idx) => (
                                        <PropertyCard
                                            key={p.id ?? p._id ?? p.slug ?? p.href ?? idx}
                                            item={p}
                                        />
                                    ))}
                                </div>
                            ) : !isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <p className="text-lg text-gray-500">No properties found</p>
                                        <p className="text-sm text-gray-400 mt-2">Try adjusting your search filters</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Pagination - cố định ở dưới */}
                        {totalPages > 0 && (
                            <div className="flex-shrink-0 p-4 bg-white border-t">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Page info */}
                                    <div className="text-sm text-gray-600">
                                        Page {page} of {totalPages} ({totalProperties} total)
                                    </div>
                                
                                {/* Pagination buttons */}
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    {getPageNumbers().map((n, idx) => (
                                        n === "..." ? (
                                            <span key={`ellipsis-${idx}`} className="px-2">...</span>
                                        ) : (
                                            <Button 
                                                key={`page-${n}`} 
                                                variant={n === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(n)}
                                            >
                                                {n}
                                            </Button>
                                        )
                                    ))}
                                    
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default PropertiesMap;