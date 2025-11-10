import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

const TYPE_OPTIONS = ["apartment", "house", "villa", "studio", "townhouse", "land"]
const PURPOSE_OPTIONS = ["sale", "rent"]
const AMENITY_OPTIONS = ["parking", "gym", "pool", "elevator", "security", "playground"]

// Defaults cho range
const BED_MIN = 0
const BED_MAX = 10
const PRICE_MIN = 0        // triệu VND
const PRICE_MAX = 5000     // triệu VND

export default function FiltersPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const isFirstRender = useRef(true)
  const isInitializing = useRef(true)

  // state filter đơn giản
  const [q, setQ] = useState("")
  const [types, setTypes] = useState([])
  const [purpose, setPurpose] = useState("")
  const [bedroomsRange, setBedroomsRange] = useState([BED_MIN, BED_MAX])
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX])
  const [amenitiesAny, setAmenitiesAny] = useState([])
  
  // ✅ Initialize state from URL params ONLY ONCE on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    
    // Restore keyword
    const qParam = params.get("q")
    if (qParam) setQ(qParam)
    
    // Restore types (array)
    const typesParam = params.getAll("types")
    if (typesParam.length > 0) setTypes(typesParam)
    
    // Restore purpose
    const purposeParam = params.get("purpose")
    if (purposeParam) setPurpose(purposeParam)
    
    // Restore bedrooms range
    const bedroomsMinParam = params.get("bedroomsMin")
    const bedroomsMaxParam = params.get("bedroomsMax")
    if (bedroomsMinParam || bedroomsMaxParam) {
      setBedroomsRange([
        bedroomsMinParam ? Number(bedroomsMinParam) : BED_MIN,
        bedroomsMaxParam ? Number(bedroomsMaxParam) : BED_MAX
      ])
    }
    
    // Restore price range
    const priceMinParam = params.get("priceMin")
    const priceMaxParam = params.get("priceMax")
    if (priceMinParam || priceMaxParam) {
      setPriceRange([
        priceMinParam ? Number(priceMinParam) : PRICE_MIN,
        priceMaxParam ? Number(priceMaxParam) : PRICE_MAX
      ])
    }
    
    // Restore amenities
    const amenitiesParam = params.getAll("amenitiesAny")
    if (amenitiesParam.length > 0) setAmenitiesAny(amenitiesParam)
    
    // Mark initialization complete AFTER all setState calls
    setTimeout(() => {
      isInitializing.current = false
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - chỉ chạy 1 lần khi mount

  const toggleInArray = (arr, v, set) => {
    if (arr.includes(v)) set(arr.filter(x => x !== v))
    else set([...arr, v])
  }

  const resetAll = () => {
    setQ("")
    setTypes([])
    setPurpose("")
    setBedroomsRange([BED_MIN, BED_MAX])
    setPriceRange([PRICE_MIN, PRICE_MAX])
    setAmenitiesAny([])
    // reset về trang 1, xóa query filter
    navigate(`${location.pathname}?page=1`, { replace: false })
  }

  // Helper function để build query params
  const buildQueryParams = useCallback((resetPage = true) => {
    const qs = new URLSearchParams(location.search)
    
    // Reset page về 1 nếu filter thay đổi
    if (resetPage) {
      qs.set("page", "1")
    }
    
    // ✅ Ensure itemsPerPage is always in URL (preserve or use default)
    if (!qs.has("itemsPerPage")) {
      qs.set("itemsPerPage", "8") // DEFAULT_ITEMS_PER_PAGE from constants
    }

    // Clear old filter params (but keep page and itemsPerPage)
    qs.delete("q")
    qs.delete("types")
    qs.delete("purpose")
    qs.delete("bedroomsMin")
    qs.delete("bedroomsMax")
    qs.delete("priceMin")
    qs.delete("priceMax")
    qs.delete("amenitiesAny")

    // Set new values
    if (q.trim()) qs.set("q", q.trim())

    // types là mảng -> append nhiều lần
    types.forEach(t => qs.append("types", t))
    if (purpose) qs.set("purpose", purpose)

    // bedrooms range
    const [bMin, bMax] = bedroomsRange
    if (bMin > BED_MIN) qs.set("bedroomsMin", String(bMin))
    if (bMax < BED_MAX) qs.set("bedroomsMax", String(bMax))

    // price range (triệu VND)
    const [pMin, pMax] = priceRange
    if (pMin > PRICE_MIN) qs.set("priceMin", String(pMin))
    if (pMax < PRICE_MAX) qs.set("priceMax", String(pMax))

    // amenitiesAny là mảng -> append nhiều lần
    amenitiesAny.forEach(a => qs.append("amenitiesAny", a))

    return qs.toString()
  }, [q, types, purpose, bedroomsRange, priceRange, amenitiesAny, location.search])
  
  // Manual apply filters (for button click)
  const applyFilters = () => {
    navigate(`${location.pathname}?${buildQueryParams()}`, { replace: false })
  }
  
  // Auto-apply filters cho checkboxes/radios/sliders (instant)
  useEffect(() => {
    // Skip if still initializing from URL
    if (isFirstRender.current || isInitializing.current) {
      isFirstRender.current = false
      return
    }
    
    const qs = buildQueryParams()
    navigate(`${location.pathname}?${qs}`, { replace: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, purpose, bedroomsRange, priceRange, amenitiesAny])
  
  // Debounce cho search keyword (delay 500ms)
  useEffect(() => {
    // Skip if still initializing from URL
    if (isFirstRender.current || isInitializing.current) {
      return
    }
    
    const timer = setTimeout(() => {
      const qs = buildQueryParams()
      navigate(`${location.pathname}?${qs}`, { replace: false })
    }, 500)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6 space-y-6">
        {/* Keyword */}
        <div className="space-y-2">
          <Label htmlFor="kw">Search keyword</Label>
          <Input
            id="kw"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="VD: chung cư, quận 1, 'làng hoa'..."
          />
        </div>

        {/* Type (checkbox) */}
        <div className="space-y-2">
          <Label>Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(t => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={types.includes(t)}
                  onChange={() => toggleInArray(types, t, setTypes)}
                />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Purpose (radio) */}
        <div className="space-y-2">
          <Label>Purpose</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="purpose"
                value=""
                checked={purpose === ""}
                onChange={() => setPurpose("")}
              />
              Any
            </label>
            {PURPOSE_OPTIONS.map(p => (
              <label key={p} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="purpose"
                  value={p}
                  checked={purpose === p}
                  onChange={() => setPurpose(p)}
                />
                <span className="capitalize">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bedrooms (range slider 2 đầu) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Bedrooms</Label>
            <span className="text-sm opacity-70">{bedroomsRange[0]} - {bedroomsRange[1]}</span>
          </div>
          <Slider
            value={bedroomsRange}
            onValueChange={setBedroomsRange}
            min={BED_MIN}
            max={BED_MAX}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Price (range slider 2 đầu, triệu VND) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Price (million VND)</Label>
            <span className="text-sm opacity-70">{priceRange[0]}M - {priceRange[1]}M</span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50}         // kéo mượt hơn; đổi thành 10 nếu muốn chi tiết hơn
            className="mt-2"
          />
        </div>

        {/* Amenities (checkbox, ANY) */}
        <div className="space-y-2">
          <Label>Amenities (any)</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMENITY_OPTIONS.map(a => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={amenitiesAny.includes(a)}
                  onChange={() => toggleInArray(amenitiesAny, a, setAmenitiesAny)}
                />
                <span className="capitalize">{a}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={applyFilters}>Apply filters</Button>
          <Button className="flex-1" variant="outline" onClick={resetAll}>Reset</Button>
        </div>
      </CardContent>
    </Card>
  )
}
