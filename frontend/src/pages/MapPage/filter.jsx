import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Filter() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Initialize from URL params
    const params = new URLSearchParams(location.search);
    
    const [mode, setMode] = useState(params.get("purpose") || "rent");
    const [searchKeyword, setSearchKeyword] = useState(params.get("q") || "");
    const [searchLocation, setSearchLocation] = useState(params.get("province") || "");
    
    const handleSearch = () => {
        const params = new URLSearchParams();
        params.set("page", "1");
        
        if (searchKeyword.trim()) params.set("q", searchKeyword.trim());
        if (searchLocation.trim()) params.set("province", searchLocation.trim());
        if (mode) params.set("purpose", mode);
        
        navigate(`${location.pathname}?${params.toString()}`, { replace: false });
    };

    return (
        <>
            <section className="w-full mx-auto px-10 shadow-md">
                {/* Desktop Layout - Horizontal */}
                <div className="hidden lg:flex items-center gap-4 py-3">
                    {/* Mode Toggle Buttons */}
                    <div className="flex items-center gap-1">
                        <Button
                            size="lg"
                            className={cn(
                                "rounded-full px-6 py-2 font-medium transition-all text-sm",
                                mode === "rent"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                            onClick={() => setMode("rent")}
                        >
                            For Rent
                        </Button>
                        <Button
                            size="lg"
                            className={cn(
                                "rounded-full px-6 py-2 font-medium transition-all text-sm",
                                mode === "sale"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                            onClick={() => setMode("sale")}
                        >
                            For Sale
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-200" />

                    {/* Search Keyword Input */}
                    <div className="space-y-2 flex items-center flex-1 px-3 py-2 min-w-0">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search Keyword"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="h-12 pl-12 pt-3 pb-3 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-200" />

                    {/* Search Location Input */}
                    <div className="space-y-2 flex items-center flex-1 px-3 py-2 min-w-0">
                        <div className="relative w-full">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Search Location"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="h-12 pl-12 pt-3 pb-3 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-200" />

                    {/* Category Dropdown - Removed for now */}

                    {/* Advanced Search Button */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="px-3 py-2 text-sm rounded-lg whitespace-nowrap"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Search advanced
                    </Button>

                    {/* Search Button */}
                    <Button
                        size="lg"
                        className="rounded-full px-6 py-2 ml-1 whitespace-nowrap"
                        onClick={handleSearch}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>

                {/* Mobile & Tablet Layout - Vertical */}
                <div className="lg:hidden space-y-4">
                    {/* Mode Toggle Buttons */}
                    <div className="flex items-center justify-center gap-1">
                        <Button
                            size="sm"
                            className={cn(
                                "rounded-full px-6 py-2 font-medium transition-all flex-1 max-w-32",
                                mode === "rent"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                            onClick={() => setMode("rent")}
                        >
                            For Rent
                        </Button>
                        <Button
                            size="sm"
                            className={cn(
                                "rounded-full px-6 py-2 font-medium transition-all flex-1 max-w-32",
                                mode === "sale"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                            onClick={() => setMode("sale")}
                        >
                            For Sale
                        </Button>
                    </div>

                    {/* Search Bar Container */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 space-y-4">
                        {/* Search Keyword Input */}
                        <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3">
                            <Search className="h-5 w-5 text-gray-400 mr-3" />
                            <Input
                                type="text"
                                placeholder="Search Keyword"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-gray-700 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Search Location Input */}
                        <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                            <Input
                                type="text"
                                placeholder="Search Location"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-gray-700 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Advanced Search Button */}
                        <div className="flex items-center justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="px-4 py-3 rounded-xl"
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-2" />
                                Advanced
                            </Button>
                        </div>

                        {/* Search Button */}
                        <Button
                            size="lg"
                            className="w-full rounded-xl py-3"
                            onClick={handleSearch}
                        >
                            <Search className="h-5 w-5 mr-2" />
                            Search
                        </Button>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Filter