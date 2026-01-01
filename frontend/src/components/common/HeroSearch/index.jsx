import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PROVINCE_API_ROOT } from "@/utils/constants";
import { nlSearchPropertiesAPI, searchPropertiesByTagAPI } from "@/apis";
import { Home, LocateFixed, MapPin, Search, SlidersHorizontal, Loader2, Sparkles, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function Divider() {
  return <span className="hidden h-8 w-px bg-neutral-200 md:block" />;
}
export default function HeroSearch({
  title = "Find Your Perfect Home",
  subtitle = "We are a real estate agency that will help you find the best residence you dream of, let's discuss your dream house?",
  backgroundUrl = "/hero-house.jpg", // change to your image path
  onSearch,
}) {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState("rent");
  const [type, setType] = useState("all");
  const [keyword, setKeyword] = useState("");

  const [additionalLocations, setAdditionalLocations] = useState([]);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState("");

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
  const getDistrictsByProvince = (code) => {
    const p = provinces.find(p => String(p.code) === String(code));
    return p?.districts || p?.wards || [];
  };

  const districts = useMemo(() => getDistrictsByProvince(provinceCode), [provinceCode, provinces]);

  const getProvinceName = (code) => provinces.find(p => String(p.code) === String(code))?.name;
  const getDistrictName = (pCode, dCode) => {
    const ds = getDistrictsByProvince(pCode);
    return ds.find(d => String(d.code) === String(dCode))?.name;
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    
    if (keyword.trim()) params.set("q", keyword.trim());
    if (mode) params.set("purpose", mode);
    
    // Type
    if (type && type !== "all") params.set("types", type);

    // Primary + additional locations
    const locationEntries = [
      { provinceCode, districtCode },
      ...additionalLocations
    ].filter(loc => loc.provinceCode || loc.districtCode);

    const provincesToQuery = [];
    const districtsToQuery = [];

    locationEntries.forEach((loc) => {
      const pName = getProvinceName(loc.provinceCode);
      const dName = getDistrictName(loc.provinceCode, loc.districtCode);
      if (pName) provincesToQuery.push(pName);
      if (dName) districtsToQuery.push(dName);
    });

    [...new Set(provincesToQuery)].forEach((p) => params.append("province", p));
    [...new Set(districtsToQuery)].forEach((d) => params.append("district", d));
    
    // Navigate to map page with search params
    navigate(`/map?${params.toString()}`);
    
    // Call onSearch callback if provided
    if (typeof onSearch === "function") {
      const primaryProvinceName = getProvinceName(provinceCode) || null;
      const primaryDistrictName = getDistrictName(provinceCode, districtCode) || null;

      onSearch({ 
        mode, 
        type, 
        provinceCode: provinceCode || null,
        provinceName: primaryProvinceName,
        districtCode: districtCode || null,
        districtName: primaryDistrictName,
        keyword,
        additionalLocations: additionalLocations.map((loc) => ({
          ...loc,
          provinceName: getProvinceName(loc.provinceCode) || null,
          districtName: getDistrictName(loc.provinceCode, loc.districtCode) || null
        }))
      });
    }
  };

  const handleAdvancedSearch = async () => {
    const q = advancedQuery.trim();
    if (!q) {
      setAdvError("Vui lòng nhập yêu cầu");
      return;
    }
    setAdvError("");
    setAdvLoading(true);
    try {
      // If query looks like a tag (#tag or tag:xxx) then use tag search
      const isTagQuery = q.startsWith("#") || q.toLowerCase().startsWith("tag:");
      if (isTagQuery) {
        const tagLabel = q.replace(/^#|^tag:\s*/i, "").trim();
        const data = await searchPropertiesByTagAPI(tagLabel, 1, 50);
        if (data.success && data.data?.properties) {
          navigate('/listing/grid', {
            state: {
              properties: data.data.properties,
              query: tagLabel,
              filters: { tag: tagLabel },
              isAISearch: true,
              isTagSearch: true
            }
          });
        } else {
          setAdvError(`Không tìm thấy bất động sản với tag "${tagLabel}"`);
        }
      } else {
        const data = await nlSearchPropertiesAPI(q);
        if (data.success && data.totalProperties > 0 && data.properties?.length) {
          navigate('/listing/grid', {
            state: {
              properties: data.properties,
              query: q,
              filters: data.filtersUsed,
              isAISearch: true
            }
          });
        } else {
          const hasSuggestions = data?.searchSuggestions && (
            data.searchSuggestions.didYouMean ||
            (data.searchSuggestions.suggestions && data.searchSuggestions.suggestions.length > 0) ||
            (data.searchSuggestions.keywordCorrections && data.searchSuggestions.keywordCorrections.length > 0)
          );
          if (hasSuggestions) {
            setAdvError("Không tìm thấy kết quả, hãy thử diễn đạt khác hoặc thêm chi tiết.");
          } else {
            setAdvError("Không tìm thấy bất động sản phù hợp.");
          }
        }
      }
    } catch (err) {
      console.error("Advanced search error", err);
      setAdvError("Có lỗi kết nối, vui lòng thử lại.");
    } finally {
      setAdvLoading(false);
    }
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
        minHeight: "92vh"
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
          {advancedMode ? (
            <div className="rounded-3xl bg-white/95 p-6 shadow-2xl text-neutral-900">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Sparkles className="h-5 w-5 text-primary mt-2" />
                  <div className="w-full text-left">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Natural language / Tag</p>
                    <Input
                      value={advancedQuery}
                      onChange={(e) => { setAdvancedQuery(e.target.value); setAdvError(""); }}
                      placeholder='Ví dụ: "Căn hộ 2 phòng ngủ gần quận 1 dưới 15 triệu" hoặc #ban-cong-rong'
                      className="mt-1 h-11 rounded-xl border bg-white px-3 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-full px-4"
                    onClick={() => { setAdvancedMode(false); setAdvError(""); }}
                    disabled={advLoading}
                  >
                    Basic search
                  </Button>
                  <Button
                    className="rounded-full px-6"
                    onClick={handleAdvancedSearch}
                    disabled={advLoading}
                  >
                    {advLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {advError && (
                <p className="mt-3 text-sm text-red-600">{advError}</p>
              )}
              <p className="mt-3 text-xs text-neutral-500">
                Mẹo: thêm #tag để tìm theo tag nhanh, hoặc mô tả tự nhiên để AI gợi ý.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-3xl bg-white/95 p-4 shadow-2xl text-neutral-900">
              <div className="flex flex-col gap-3 rounded-full bg-white py-2 md:flex-row md:items-center">
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
                    placeholder="Search"
                    className="h-7 rounded-lg border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Advanced */}
              <div className="order-last flex items-center justify-center px-2 md:order-none">
                <Button
                  variant="secondary"
                  className="h-12 rounded-full px-4 border-2 bg-white dark:bg-black"
                  onClick={() => {
                    setAdvancedMode(true);
                    setAdvancedQuery(keyword);
                  }}
                >
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

              {additionalLocations.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl bg-white/60 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">More locations</p>
                  {additionalLocations.map((loc, idx) => {
                    const districtsForLoc = getDistrictsByProvince(loc.provinceCode);
                    return (
                      <div key={idx} className="flex flex-col gap-2 rounded-2xl bg-neutral-50 px-3 py-2 md:flex-row md:items-center">
                        <div className="flex grow items-center gap-3">
                          <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="w-full text-left">
                            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Province</p>
                            <Select
                              value={loc.provinceCode}
                              onValueChange={(val) => setAdditionalLocations((prev) => prev.map((item, i) => i === idx ? { provinceCode: val, districtCode: "" } : item))}
                            >
                              <SelectTrigger className="h-9 w-full rounded-lg bg-white px-2 text-sm text-neutral-700 focus-visible:ring-0">
                                <SelectValue placeholder="Select province" />
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

                        <div className="flex grow items-center gap-3">
                          <div className="hidden md:grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                            <LocateFixed className="h-4 w-4" />
                          </div>
                          <div className="w-full text-left">
                            <p className="text-[10px] uppercase tracking-wide text-neutral-500">District</p>
                            <Select
                              value={loc.districtCode}
                              onValueChange={(val) => setAdditionalLocations((prev) => prev.map((item, i) => i === idx ? { ...item, districtCode: val } : item))}
                              disabled={!loc.provinceCode || districtsForLoc.length === 0}
                            >
                              <SelectTrigger className="h-9 w-full rounded-lg bg-white px-2 text-sm text-neutral-700 focus-visible:ring-0">
                                <SelectValue placeholder={!loc.provinceCode ? "Select a province first" : (districtsForLoc.length ? "Select district" : "No districts")} />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {districtsForLoc.map((d) => (
                                  <SelectItem key={d.code} value={String(d.code)}>
                                    {d.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-neutral-500"
                          onClick={() => setAdditionalLocations((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
