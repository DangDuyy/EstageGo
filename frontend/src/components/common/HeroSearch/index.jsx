import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PROVINCE_API_ROOT } from "@/utils/constants";
import { Home, LocateFixed, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function Divider() {
  return <span className="hidden h-8 w-px bg-neutral-200 md:block" />;
}
export default function HeroSearch({
  title = "Find Your Perfect Home",
  subtitle = "We are a real estate agency that will help you find the best residence you dream of, let's discuss your dream house?",
  backgroundUrl = "/hero-house.jpg", // change to your image path
  onSearch,
}) {
  const [mode, setMode] = useState("rent");
  const [type, setType] = useState("all");
  const [keyword, setKeyword] = useState("");

  const [provinceCode, setProvinceCode] = useState("")
  const [districtCode, setDistrictCode] = useState("")
  const [provinces, setProvinces] = useState([])
  const [loadingProv, setLoadingProv] = useState(false)
  const [errorProv, setErrorProv] = useState("")

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingProv(true);
        setErrorProv("");

        const res = await fetch(`${PROVINCE_API_ROOT}/api/v2/?depth=2`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancelled) setProvinces(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setErrorProv(String(error));
      } finally {
        if (!cancelled) setLoadingProv(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);


  //fetch huyen xa theo tinh
  const districts = useMemo(() => {
    const p = provinces.find(p => String(p.code) === String(provinceCode))
    return p?.wards ?? []
  },[provinceCode, provinces])

  const handleSearch = () => {
    const payload = { 
      mode, 
      type, 
      //tra ve ca code lan ten cho backend
      provinceCode: provinceCode || null,
      provinceName: provinces.find(p => String(p.code) === String(provinceCode))?.name || null,
      districtCode: districtCode || null,
      districtName: districts.find(d => String(d.code) === String(districtCode))?.name || null,
      keyword 
    };
    if (typeof onSearch === "function") onSearch(payload);
    else console.log("Search:", payload);
  };

  //reset huyen di doi tinh
  useEffect(() => {
    setDistrictCode("")
  }, [provinceCode])

  return (
    <section
      className="relative isolate overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        minHeight: "50vh"
      }}
    >

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30" />

      <div className="relative my-20 mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-16 lg:py-28 text-center text-white dark:text-black">
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight drop-shadow-md">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-2xl sm:text-xl lg:text-xl text-white/90 dark:text-black">
          {subtitle}
        </p>

        {/* Mode toggle */}
        <div className="mt-30 flex items-center justify-center gap-3">
          <Button
            size="lg"
            className={cn(
              "rounded-full px-6 cursor-pointer",
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
              "rounded-full px-6 border-2 cursor-pointer",
              mode === "sale" ? "bg-blue-600 text-white border-0 hover:bg-blue-500 hover:text-amber-50" : "bg-white/90 text-neutral-900"
            )}
            onClick={() => setMode("sale")}
          >
            For Sale
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mt-8 w-full max-w-7xl">
          <div className="flex flex-col gap-3 rounded-full bg-white py-2 shadow-2xl md:flex-row md:items-center">            {/* Type */}
            {/* TYPE */}
            <div className="flex items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <Home className="h-4 w-4" />
              </div>

              <div className="min-w-20 text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Type</p>

                <Select value={type} onValueChange={setType}>
                  <SelectTrigger
                    className="
                      h-9 w-36 border-0 bg-transparent shadow-none
                      p-0 pr-8 text-sm text-neutral-700
                      focus:ring-0 focus:outline-none
                    "
                  >
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" sideOffset={4} className="w-36">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BỎ ChevronDown rời ở đây đi */}
              {/* <ChevronDown ... />  --> remove */}
            </div>


            <Divider />

            {/* Location Combobox */}
            <div className="flex grow items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Province</p>
                <Select
                  value={provinceCode}
                  onValueChange={setProvinceCode}
                  disabled={loadingProv || !!errorProv}
                >
                  <SelectTrigger className="h-7 w-full rounded-lg border-0 bg-transparent px-2 text-sm text-neutral-700 focus-visible:ring-0">
                    <SelectValue placeholder={loadingProv ? "Loading..." : errorProv ? "Load failed" : "Select province"}/>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {provinces.map((p) => (
                      <SelectItem key={p.code} value={String(p.code)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Divider />

            <div className="flex grow items-center gap-3 rounded-full px-3 py-2 md:px-4">
              <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <LocateFixed className="h-4 w-4" />
              </div>
              <div className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">District</p>

                <Select
                  value={districtCode}
                  onValueChange={setDistrictCode}
                  disabled={!provinceCode || districts.length === 0}
                >
                  <SelectTrigger className="h-7 w-full rounded-lg border-0 bg-transparent px-2 text-sm text-neutral-700 focus-visible:ring-0">
                    <SelectValue placeholder={!provinceCode ? "Select a province first" : (districts.length ? "Select district" : "No districts")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districts.map((d) => (
                      <SelectItem key={d.code} value={String(d.code)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button variant="secondary" className="h-12 rounded-full px-4 border-2 bg-white dark:bg-black">
                <span className="mr-2">Search advanced</span>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="flex items-center justify-center mx-5">
              <Button onClick={handleSearch} className="h-12 w-30 rounded-full px-5">
                <span>Search</span>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
