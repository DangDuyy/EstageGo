import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { MapPin, Search, SlidersHorizontal, ChevronDown, Home } from "lucide-react";

// Small vertical separator used inside the pill bar
function Divider() {
  return <span className="hidden h-8 w-px bg-neutral-200 md:block" />;
}

// HeroSearch (JS + JSX)
// - shadcn/ui + TailwindCSS
// - Fully responsive hero with pill-shaped search bar
// - Modes: "rent" | "sale"
export default function HeroSearch({
  title = "Find Your Perfect Home",
  subtitle = "We are a real estate agency that will help you find the best residence you dream of, let's discuss your dream house?",
  backgroundUrl = "/hero-house.jpg", // change to your image path
  onSearch,
}) {
  const [mode, setMode] = useState("rent");
  const [type, setType] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");

  const locations = [
    "Ho Chi Minh City",
    "Ha Noi",
    "Da Nang",
    "Binh Duong",
    "Dong Nai",
    "Can Tho",
  ];

  const handleSearch = () => {
    const payload = { mode, type, location, keyword };
    if (typeof onSearch === "function") onSearch(payload);
    else console.log("Search:", payload);
  };

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "70vh",
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-28 text-center text-white">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base text-white/90">
          {subtitle}
        </p>

        {/* Mode toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            size="lg"
            className={cn(
              "rounded-full px-6",
              mode === "rent" ? "bg-blue-600 text-white" : "bg-white/90 text-neutral-900 hover:bg-white"
            )}
            onClick={() => setMode("rent")}
          >
            For Rent
          </Button>
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "rounded-full px-6 border-2",
              mode === "sale" ? "border-blue-600 text-blue-600 bg-white" : "bg-white/90 text-neutral-900 hover:bg-white"
            )}
            onClick={() => setMode("sale")}
          >
            For Sale
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mt-8 w-full max-w-5xl">
          <div className="flex flex-col gap-3 rounded-full bg-white/95 p-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/80 md:flex-row md:items-center">
            {/* Type */}
            <div className="flex items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <Home className="h-4 w-4" />
              </div>
              <div className="min-w-20 text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Type</p>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-7 w-28 border-none p-0 pr-5 text-sm focus:ring-0">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ChevronDown className="ml-[-18px] h-4 w-4 text-neutral-400" />
            </div>

            <Divider />

            {/* Location Combobox */}
            <div className="flex grow items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Location</p>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-7 w-full justify-between rounded-lg px-2 text-left font-normal text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      {location ? location : "Search location"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type a city..." />
                      <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((loc) => (
                            <CommandItem
                              key={loc}
                              value={loc}
                              onSelect={(v) => {
                                setLocation(v);
                                setLocationOpen(false);
                              }}
                            >
                              <MapPin className="mr-2 h-4 w-4" /> {loc}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Divider />

            {/* Keyword */}
            <div className="flex grow items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <Search className="h-4 w-4" />
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Keyword</p>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search keyword..."
                  className="h-7 rounded-lg border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Advanced */}
            <div className="order-last flex items-center justify-center px-2 md:order-none">
              <Button variant="secondary" className="rounded-full px-4">
                <span className="mr-2">Search advanced</span>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="flex items-center justify-center">
              <Button onClick={handleSearch} className="h-12 rounded-full px-6">
                <span className="mr-2">Search</span>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
