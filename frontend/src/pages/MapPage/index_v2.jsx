import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { fetchAllPropertiesAPI, getPropertiesWithinPolygon, getPropertiesWithMap } from "@/apis";
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
import MapContainer from "@/components/common/GoogleMap/MapContainer";
import MarkerLayer from "@/components/common/GoogleMap/MarkerLayer";
import { MapsContext } from "@/components/common/GoogleMap/MapProvider";
import PropertyMarker from "@/components/common/GoogleMap/PropertyMarker";

function PropertiesMap() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);

    const page = parseInt(query.get("page") || "1", 10);
    const itemsPerPage = parseInt(query.get("limit") || 20, 10);

    const [sortBy] = useState("default");

    // ✅ Khởi tạo mảng rỗng để có thể spread/map an toàn
    // const [properties, setProperties] = useState([]);
    const [propertiesList, setPropertiesList] = useState([])
    const [propertiesMap, setPropertiesMap] = useState([])
    const [pagination, setPagination] = useState({})
    const [totalProperties, setTotalProperties] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const { google, loaded } = useContext(MapsContext)

    const onFilterChange = (query) => {
        const params = new URLSearchParams(location.search)

        const {
            regionSelection,
            GID_1,
            province,
            GID_2,
            district,
            GID_3,
            ward,
            page = 1,
            limit = 20,
            map
        } = query

        if (regionSelection) params.set("regionSelection", regionSelection)
        else params.delete("regionSelection")

        if (GID_1) params.set("GID_1", GID_1)
        else params.delete("GID_1")

        if (province) params.set("province", province)
        else params.delete("province")

        if (GID_2) params.set("GID_2", GID_2)
        else params.delete("GID_2")

        if (district) params.set("district", district)
        else params.delete("district")

        if (GID_3) params.set("GID_3", GID_3)
        else params.delete("GID_3")

        if (ward) params.set("ward", ward)
        else params.delete("ward")

        params.set("page", page)
        params.set("limit", limit)

        console.log('param:', params)

        navigate({
            pathname: location.pathname,
            search: params.toString()
        })
    }

    useEffect(() => {
        const params = new URLSearchParams(location.search)

        const query = {
            // 🔹 Region
            regionSelection: params.get("regionSelection"),

            // 🔹 Address
            address: {
                province: params.get("province"),
                district: params.get("district"),
                ward: params.get("ward"),
                street: params.get("street")
            },

            // 🔹 Pagination
            page: Number(params.get("page")) || 1,
            limit: Number(params.get("limit")) || DEFAULT_ITEMS_PER_PAGE,

            // 🔹 Type / Purpose / Status
            type: params.get("type"),
            types: params.getAll("types"),
            purpose: params.get("purpose"),
            status: params.get("status"),

            // 🔹 Rooms
            bedrooms: params.get("bedrooms") ? Number(params.get("bedrooms")) : undefined,
            bedroomsMin: params.get("bedroomsMin") ? Number(params.get("bedroomsMin")) : undefined,
            bedroomsMax: params.get("bedroomsMax") ? Number(params.get("bedroomsMax")) : undefined,

            bathrooms: params.get("bathrooms") ? Number(params.get("bathrooms")) : undefined,
            bathroomsMin: params.get("bathroomsMin") ? Number(params.get("bathroomsMin")) : undefined,
            bathroomsMax: params.get("bathroomsMax") ? Number(params.get("bathroomsMax")) : undefined,

            // 🔹 Area
            area: params.get("area") ? Number(params.get("area")) : undefined,
            areaMin: params.get("areaMin") ? Number(params.get("areaMin")) : undefined,
            areaMax: params.get("areaMax") ? Number(params.get("areaMax")) : undefined,

            // 🔹 Price
            price: params.get("price") ? Number(params.get("price")) : undefined,
            priceMin: params.get("priceMin") ? Number(params.get("priceMin")) : undefined,
            priceMax: params.get("priceMax") ? Number(params.get("priceMax")) : undefined,

            // 🔹 Amenities
            amenitiesAll: params.getAll("amenitiesAll"),
            amenitiesAny: params.getAll("amenitiesAny"),

            // 🔹 Sort
            sortBy: params.get("sortBy") || "createdAt",
            sortDir: params.get("sortDir") || "desc",

            // 🔹 Map
            map: params.get("north") ? {
                north: Number(params.get("north")),
                south: Number(params.get("south")),
                east: Number(params.get("east")),
                west: Number(params.get("west"))
            } : undefined,

            // 🔹 Geo
            GID_1: params.get("GID_1"),
            GID_2: params.get("GID_2"),
            GID_3: params.get("GID_3")
        }

        const fetchData = async () => {
            try {
                setIsLoading(true)
                const res = await getPropertiesWithMap(query)

                setPropertiesList(res?.list?.items ?? [])
                setPagination(res?.list?.pagination ?? {})
                setPropertiesMap(res?.map ?? {})
            } catch (err) {
                console.error("Fetch properties error:", err)
            }
            finally {
                setIsLoading(false)

            }
        }

        fetchData()

        const zoomToProvince = async () => {
            let data
            // Lọc các tỉnh
            let filteredFeatures

            if (query.GID_1) {
                data = await fetchGeoLevelData(1)
                filteredFeatures = data.features.filter(f => f.properties.GID_1 === query.GID_1);
            }
            else if (query.GID_2) {
                data = await fetchGeoLevelData(2)
                filteredFeatures = data.features.filter(f => f.properties.GID_2 === query.GID_2);
            }
            else if (query.GID_3) {
                data = await fetchGeoLevelData(3)
                console.log("data", data)
                filteredFeatures = data.features.filter(f => f.properties.GID_3 === query.GID_3);
            }

            let selectedFeature
            if (filteredFeatures) {

                const featureCollection = {
                    type: "FeatureCollection",
                    features: filteredFeatures
                };

                // Thêm vào map
                const features = mapRef.current.data.addGeoJson(featureCollection);

                selectedFeature = features[0]
            }

            if (!selectedFeature) return
            selectedFeatureRef.current = selectedFeature;

            const featureBounds = new google.maps.LatLngBounds();
            selectedFeature.getGeometry().forEachLatLng((latlng) =>
                featureBounds.extend(latlng)
            );
            mapRef.current.fitBounds(featureBounds);

            const selectedLayer = selectedLayerRef.current
            // Clear previous highlights
            selectedLayer.forEach((f) => selectedLayer.remove(f));

            // Highlight feature
            selectedFeature.toGeoJson((geoJson) => {
                selectedLayer.addGeoJson(geoJson);
            });
        }

        zoomToProvince()

    }, [location.search, loaded])


    // Tính tổng số trang - nếu không có properties thì totalPages = 0
    const totalPages = totalProperties > 0 ? Math.ceil(totalProperties / itemsPerPage) : 0;

    // Hàm navigate đến trang khác
    const goToPage = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        const params = new URLSearchParams(location.search);
        params.set("page", String(newPage));
        navigate(`${location.pathname}?${params.toString()}`);
    };

    // Hàm thay đổi items per page
    const changeItemsPerPage = (value) => {
        const params = new URLSearchParams(location.search);
        params.set("limit", value);
        params.set("page", "1"); // Reset về trang 1
        navigate(`${location.pathname}?${params.toString()}`);
    };

    // Tạo array các số trang hiển thị
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (pagination?.totalPages <= maxVisible) {
            for (let i = 1; i <= pagination.totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Luôn hiển thị trang đầu
            pages.push(1);

            // Tính toán range xung quanh current page
            let start = Math.max(2, page - 1);
            let end = Math.min(pagination.totalPages - 1, page + 1);

            // Thêm ... nếu cần
            if (start > 2) pages.push("...");

            // Thêm các trang giữa
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Thêm ... nếu cần
            if (end < pagination.totalPages - 1) pages.push("...");

            // Luôn hiển thị trang cuối
            if (pagination.totalPages > 1) pages.push(pagination.totalPages);
        }

        return pages;
    };


    const mapRef = useRef(null);
    const selectedFeatureRef = useRef(null);
    const selectedLayerRef = useRef(null); // ✅ layer riêng cho vùng được chọn
    const [searchValue, setSearchValue] = useState('')


    // Helper: traverse geometry để extend bounds
    const extendBoundsForFeature = (feature, bounds) => {
        const geom = feature.getGeometry();

        const recurse = (g) => {
            if (g instanceof window.google.maps.Data.Point) {
                bounds.extend(g.get());
            } else if (
                g instanceof window.google.maps.Data.LineString ||
                g instanceof window.google.maps.Data.LinearRing
            ) {
                g.getArray().forEach((latlng) => bounds.extend(latlng));
            } else if (g instanceof window.google.maps.Data.Polygon) {
                g.getArray().forEach((r) => r.getArray().forEach((latlng) => bounds.extend(latlng)));
            } else if (g instanceof window.google.maps.Data.MultiPolygon) {
                g.getArray().forEach((p) =>
                    p.getArray().forEach((r) => r.getArray().forEach((latlng) => bounds.extend(latlng)))
                );
            } else if (g instanceof window.google.maps.Data.GeometryCollection) {
                g.getArray().forEach((sub) => recurse(sub));
            }
        };

        recurse(geom);
    };

    const fetchGeoLevelData = async (level) => {
        const urlMap = {
            0: "/geojson/gadm41_VNM_0.json",
            1: "/geojson/gadm41_VNM_1.json",
            2: "/geojson/gadm41_VNM_2.json",
            3: "/geojson/gadm41_VNM_3.json",
        };
        const url = urlMap[level];
        if (!url) return null;
        const data = await fetch(url).then((r) => r.json());
        return data;
    }

    const loadGeoJsonLevel1ToMap = async (map) => {
        console.log("Loading Level 1 data");

        // 1️⃣ Load Level 0 + 1
        // const level0 = await fetch("/geojson/gadm41_VNM_0.json").then((r) => r.json());
        const level1 = await fetchGeoLevelData(1);
        // const level1 = await fetch("/geojson/gadm41_VNM_1.json").then((r) => r.json());
        // const level2 = await fetch("/geojson/gadm41_VNM_2.json").then((r) => r.json());
        // map.data.addGeoJson(level0);
        map.data.addGeoJson(level1);
        // map.data.addGeoJson(level2)

        // 2️⃣ Giữ màu mặc định Google Maps
        map.data.setStyle({ fillOpacity: 0, strokeWeight: 1 });

        // 3️⃣ Hover highlight
        map.data.addListener("mouseover", (e) => {
            // Nếu feature này KHÔNG phải là feature đang được chọn thì mới highlight tạm
            if (selectedFeatureRef.current !== e.feature) {
                map.data.overrideStyle(e.feature, {
                    fillColor: "#619963",
                    fillOpacity: 0.5,
                });
            }
        });

        map.data.addListener("mouseout", (e) => {
            // Nếu feature không phải feature đang chọn => revert style
            if (selectedFeatureRef.current !== e.feature) {
                map.data.revertStyle(e.feature);
            }
        });

        // 4️⃣ Click Level 1 → chọn tỉnh
        map.data.addListener("click", async (e) => {
            // Xóa các feature mà ở cấp 2 trở đi
            map.data.forEach((f) => {
                if (f.getProperty('GID_2')) {
                    map.data.remove(f)
                }
            })
            // Bỏ highlight cũ trên layer chính
            if (selectedFeatureRef.current) {
                map.data.revertStyle(selectedFeatureRef.current);
            }

            // Xóa highlight cũ trên layer mới
            selectedLayerRef.current.forEach((f) => selectedLayerRef.current.remove(f));

            // Cập nhật tỉnh đang chọn
            selectedFeatureRef.current = e.feature;

            // Zoom chính xác
            const bounds = new window.google.maps.LatLngBounds();
            extendBoundsForFeature(e.feature, bounds);
            map.fitBounds(bounds);

            // ✅ Chuyển feature được chọn sang layer riêng (nằm trên cùng)
            const geoJson = await new Promise((resolve) => e.feature.toGeoJson(resolve));
            selectedLayerRef.current.addGeoJson(geoJson);

            const regionSelection = e.feature.getProperty("TYPE_1") + e.feature.getProperty("NAME_1")

            onFilterChange({ regionSelection, GID_1: e.feature.getProperty("GID_1") })

            setSearchValue('')

        });
    };

    const onLoad = async (map) => {
        mapRef.current = map;

        if (!selectedLayerRef.current) {
            selectedLayerRef.current = new google.maps.Data({ map });
            selectedLayerRef.current.setStyle({
                strokeColor: "#4285F4",
                strokeWeight: 4,
                fillOpacity: 0,
                zIndex: 100,
            });
        }

        loadGeoJsonLevel1ToMap(map);

        map.addListener("zoom_changed", async () => {
            const zoom = map.getZoom();
            console.log("Zoom changed:", zoom);
            if (zoom < 10) {
                // Kiểm tra map.data đã có dữ liệu chưa
                let count = 0;
                map.data.forEach(() => {
                    count += 1;
                });
                if (count > 1) return; // Đã có dữ liệu rồi thì không load lại
                loadGeoJsonLevel1ToMap(map);
            }
            else {
                // Xóa toàn bộ dữ liệu hiện có
                map.data.forEach((f) => {
                    if (selectedFeatureRef.current !== f) {
                        map.data.remove(f)
                    }
                });
            }
        });

    };

    const handlePlaceSelected = async (place) => {
        if (!place.geometry?.location || !mapRef.current) return;

        // Xóa các feature mà ở cấp 2 trở đi
        mapRef.current.data.forEach((f) => {
            if (f.getProperty('GID_2')) {
                mapRef.current.data.remove(f)
            }
        })

        console.log(place)
        const latLng = place.geometry.location;

        // const selectedLayer = selectedLayerRef.current
        // // Clear previous highlights
        // selectedLayer.forEach((f) => selectedLayer.remove(f));

        let selectedFeature = null;

        // Hàm kiểm tra nếu point nằm trong polygon
        const pointInPolygon = (point, polygon) => {
            let inside = false;
            const paths = polygon.getArray().map((path) => path.getArray());
            for (let i = 0; i < paths.length; i++) {
                const vs = paths[i];
                let j = vs.length - 1;
                for (let k = 0; k < vs.length; k++) {
                    const xi = vs[k].lat(), yi = vs[k].lng();
                    const xj = vs[j].lat(), yj = vs[j].lng();
                    if ((yi > point.lng() !== yj > point.lng()) &&
                        point.lat() < ((xj - xi) * (point.lng() - yi)) / (yj - yi) + xi) {
                        inside = !inside;
                    }
                    j = k;
                }
            }
            return inside;
        };

        const level1Data = await fetchGeoLevelData(1);
        level1Data.features.forEach((feat) => {
            const geometry = feat.geometry;
            const type = geometry.type;

            const constructPolygon = (coords) => {
                const paths = coords[0].map(([lng, lat]) => new google.maps.LatLng(lat, lng));
                return new google.maps.Data.Polygon([paths]);
            };
            if (type === "Polygon") {
                const polygon = constructPolygon(geometry.coordinates);
                if (pointInPolygon(latLng, polygon)) {
                    feat = mapRef.current.data.addGeoJson(feat)[0];
                    selectedFeature = feat;
                }
            } else if (type === "MultiPolygon") {
                geometry.coordinates.forEach((polyCoords) => {
                    const polygon = constructPolygon(polyCoords);
                    if (pointInPolygon(latLng, polygon)) {
                        feat = mapRef.current.data.addGeoJson(feat)[0];
                        selectedFeature = feat;
                    }
                });
            }
        });

        if (!selectedFeature) return;

        // Bỏ highlight cũ trên layer chính
        if (selectedFeatureRef.current) {
            mapRef.current.data.revertStyle(selectedFeatureRef.current);
        }

        // province
        selectedFeatureRef.current = selectedFeature;


        // Nếu tìm thấy ward, district từ address_components thì dùng để lọc GeoJSON chính xác hơn
        const addressComponents = place.address_components ?? []
        let province = null
        let district = null
        let ward = null
        let street = null
        addressComponents.forEach((c) => {
            if (c.types.includes("administrative_area_level_1")) {
                province = c.short_name
            }
            if (c.types.includes("administrative_area_level_2")) {
                district = c.short_name
            }
            if (c.types.includes("sublocality_level_1")) {
                ward = c.short_name
            }
            if (c.types.includes("route")) {
                street = c.short_name
            }
        })

        console.log({ province, district, ward, street })

        let data = null
        let filteredFeatures = null
        if (ward) {
            data = await fetch("/geojson/gadm41_VNM_3.json").then((r) => r.json());
            filteredFeatures = data.features.filter(f => f.properties.NAME_3 === ward.replace(" ", "") && f.properties.NAME_2 === district.replace(" ", ""));
        }
        else if (district) {
            data = await fetch("/geojson/gadm41_VNM_2.json").then((r) => r.json());
            // Lọc các huyện của tỉnh
            filteredFeatures = data.features.filter(f => f.properties.NAME_2 === district.replace(" ", ""));
        }

        if (filteredFeatures) {

            const featureCollection = {
                type: "FeatureCollection",
                features: filteredFeatures
            };

            // Thêm vào map
            const features = mapRef.current.data.addGeoJson(featureCollection);

            selectedFeature = features[0]
        }

        selectedFeatureRef.current = selectedFeature;

        onFilterChange({
            province,
            district,
            ward,
            street,
            ...(ward
                ? { GID_3: selectedFeature.getProperty("GID_3") }
                : { GID_2: selectedFeature.getProperty("GID_2") }
            )
        })

        const featureBounds = new google.maps.LatLngBounds();
        selectedFeature.getGeometry().forEachLatLng((latlng) =>
            featureBounds.extend(latlng)
        );
        mapRef.current.fitBounds(featureBounds);

        const selectedLayer = selectedLayerRef.current
        // Clear previous highlights
        selectedLayer.forEach((f) => selectedLayer.remove(f));

        // Highlight feature
        selectedFeature.toGeoJson((geoJson) => {
            selectedLayer.addGeoJson(geoJson);
        });
    };

    const handleRemoveBoundary = () => {
        const selectedLayer = selectedLayerRef.current
        // Clear previous highlights
        selectedLayer.forEach((f) => selectedLayer.remove(f));

        selectedFeatureRef.current = null
        mapRef.current.data.forEach((f) => {
            mapRef.current.data.remove(f)
        })
        onFilterChange({})
    }

    return (
        <>
            <NavBar />
            <div className="w-full pt-20 h-screen flex flex-col fixed inset-0 overflow-hidden">
                {/* Filter - cố định ở trên */}
                <div className="flex-shrink-0 z-10">
                    <Filter searchValue={searchValue} setSearchValue={setSearchValue} handlePlaceSelected={handlePlaceSelected} />
                </div>

                {/* Main content area - chiếm phần còn lại của screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-14 min-h-0">
                    {/* Map - cố định, không scroll */}
                    <div className="lg:col-span-8 h-full relative">
                        {/* Floating clear province button */}
                        {(new URLSearchParams(location.search).get("GID_1") ||
                            new URLSearchParams(location.search).get("GID_2") ||
                            new URLSearchParams(location.search).get("GID_3")) && (
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={handleRemoveBoundary}
                                        className="
      flex items-center gap-2
      px-4 py-2
      bg-white
      border-2 border-blue-600
      rounded-sm
      shadow-md
      text-gray-900 font-bold
      hover:bg-blue-50
      hover:text-primary
      transition
      cursor-pointer
    "
                                    >
                                        Remove Boundary
                                        <X />
                                    </button>
                                </div>

                            )}

                        <MapContainer onLoad={onLoad} zoom={6} style={{ height: "100%", width: "100%", cursor: "default" }}>
                            {propertiesMap.markers && propertiesMap.markers.length > 0 && (
                                // <MarkerLayer
                                //     items={properties
                                //         .filter(p => p.address?.location?.coordinates?.length === 2) // chỉ lấy những item có tọa độ hợp lệ
                                //         .map((p) => ({
                                //             id: p._id,
                                //             lat: p.address?.location?.coordinates[1], // GeoJSON: [lng, lat]
                                //             lng: p.address?.location?.coordinates[0]
                                //         }))}
                                //     onMarkerClick={(item) => console.log(item)}
                                // />

                                propertiesMap.markers
                                    .filter(p => p.address?.location?.coordinates?.length === 2)
                                    .map((p) => (
                                        <PropertyMarker property={p} />
                                    ))
                            )}

                        </MapContainer>
                    </div>

                    {/* Properties list - có thể scroll */}
                    <div className="lg:col-span-6 p-4 shadow-lg shadow-black/90 flex flex-col h-full overflow-y-auto">
                        {/* Main Header */}
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-medium">Real Estate & Homes For Sale</h3>
                                <span className="text-base">{pagination?.total} results</span>
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

                            {!isLoading && propertiesList.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {propertiesList.map((p, idx) => (
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
                        {pagination.total > 0 && (
                            <div className="flex-shrink-0 p-4 bg-white border-t">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Page info */}
                                    <div className="text-sm text-gray-600">
                                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
                                                    variant={n == pagination.page ? "default" : "outline"}
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