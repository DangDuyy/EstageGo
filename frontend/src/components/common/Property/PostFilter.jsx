import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office" },
]

const PURPOSE_OPTIONS = [
  { value: "all", label: "All Purposes" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
]

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "1day", label: "Last 24 Hours" },
  { value: "1week", label: "Last Week" },
  { value: "1month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
]

const EXPIRY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active Listings" },
  { value: "expired", label: "Expired Listings" },
]

export default function PostFilter() {
  const navigate = useNavigate()
  const location = useLocation()

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    purpose: "all",
    status: "all",
    timeRange: "all",
    expiryStatus: "all",
  })

  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search)

    setFilters({
      type: params.get("type") || "all",
      purpose: params.get("purpose") || "all",
      status: params.get("status") || "all",
      timeRange: params.get("timeRange") || "all",
      expiryStatus: params.get("expiryStatus") || "all",
    })

    const fromDateParam = params.get("fromDate")
    if (fromDateParam) setFromDate(new Date(fromDateParam))

    const toDateParam = params.get("toDate")
    if (toDateParam) setToDate(new Date(toDateParam))
  }, [location.search])

  const handleApplyFilter = () => {
    const searchParams = new URLSearchParams(location.search)

    // Add filters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        searchParams.set(key, value)
      } else {
        searchParams.delete(key)
      }
    })

    // Add date range if custom
    if (filters.timeRange === "custom") {
      if (fromDate) searchParams.set("fromDate", fromDate.toISOString())
      else searchParams.delete("fromDate")

      if (toDate) searchParams.set("toDate", toDate.toISOString())
      else searchParams.delete("toDate")
    } else {
      searchParams.delete("fromDate")
      searchParams.delete("toDate")
    }

    searchParams.set("page", "1") // Reset to page 1

    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : ""
    navigate(`${location.pathname}${queryString}`)
  }

  const handleClearFilter = () => {
    setFilters({
      type: "all",
      purpose: "all",
      status: "all",
      timeRange: "all",
      expiryStatus: "all",
    })
    setFromDate(null)
    setToDate(null)

    // Keep only search query and owner
    const searchParams = new URLSearchParams(location.search)
    const searchQuery = searchParams.get("q")
    const owner = searchParams.get("owner")

    const newParams = new URLSearchParams()
    if (searchQuery) newParams.set("q", searchQuery)
    if (owner) newParams.set("owner", owner)

    navigate(
      `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`
    )
  }

  // Count active filters (exclude "all" values)
  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "all" && v !== ""
  ).length + (fromDate ? 1 : 0) + (toDate ? 1 : 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="inline-flex items-center gap-2 relative hover:bg-accent transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start" sideOffset={8}>
        <div className="flex flex-col max-h-[600px]">
          {/* Header - Fixed */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-lg">Filters</h4>
                {activeFilterCount > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilter}
                  className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-6 py-4 space-y-5">
            {/* Time Range Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                Posted Date
              </Label>
              <Select
                value={filters.timeRange}
                onValueChange={(value) =>
                  setFilters({ ...filters, timeRange: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom date range */}
              {filters.timeRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 text-sm",
                            !fromDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {fromDate ? format(fromDate, "dd/MM/yyyy") : "Pick"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 text-sm",
                            !toDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {toDate ? format(toDate, "dd/MM/yyyy") : "Pick"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          initialFocus
                          disabled={(date) => fromDate && date < fromDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Expiry Status */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Expiry Status</Label>
              <Select
                value={filters.expiryStatus}
                onValueChange={(value) =>
                  setFilters({ ...filters, expiryStatus: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select expiry status" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Property Details Section */}
            <div className="space-y-4">
              <h5 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Property Details
              </h5>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Property Type */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Purpose</Label>
                  <Select
                    value={filters.purpose}
                    onValueChange={(value) =>
                      setFilters({ ...filters, purpose: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed */}
          <div className="px-6 py-4 border-t bg-muted/30 mt-auto">
            <div className="flex gap-3">
              <Button 
                onClick={handleApplyFilter} 
                className="flex-1 h-10 font-medium shadow-sm"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilter} 
                className="flex-1 h-10 font-medium"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}