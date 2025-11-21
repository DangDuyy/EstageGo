import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MapsContext } from "./MapProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapContainer from "./MapContainer";
import { InfoWindow, Marker } from "@react-google-maps/api";
import CustomOverlayMarker from "./CustomOverlayMarker";
import { MARKER_TYPES } from "./data";
import { Separator } from "@/components/ui/separator";

// icon tùy chỉnh theo Google
const ICONS = {
    supermarket: "/icons/supermarket.png",
    school: "/icons/school.png",
    restaurant: "/icons/restaurant.png",
    hospital: "/icons/hospital.png",
    park: "/icons/park.png",
    cafe: "/icons/cafe.png",
};

// nhóm loại tiện ích hiển thị tab
const PLACE_TABS = [
    { key: "school", label: "School" },
    { key: "supermarket", label: "Supermarket" },
    { key: "park", label: "Park" },
    { key: "hospital", label: "Hospital" },
    { key: "restaurant", label: "Restaurant" },
];

export const PropertyDetailMap = ({ property }) => {
    const mapRef = useRef(null);
    const [places, setPlaces] = useState([]);
    const [activeType, setActiveType] = useState("school");
    const [selected, setSelected] = useState(null);
    const [position, setPosition] = useState({ lat: property.address?.location?.coordinates[1], lng: property.address?.location?.coordinates[0] })
    const [typeMetaData, setTypeMetaData] = useState()

    useEffect(() => {
        const metaData = MARKER_TYPES[activeType]
        setTypeMetaData(metaData)
    }, [activeType])

    const { loaded, google } = useContext(MapsContext)

    const tabs = useMemo(() => {
        return PLACE_TABS.map(p => ({
            ...p,
            icon: MARKER_TYPES[p.key].icon
        }));
    }, []);

    // khi map load
    const onMapLoad = (map) => {
        mapRef.current = map;
        loadPlaces(activeType);
    };

    const loadPlaces = async (type) => {
        if (!mapRef.current) return;

        const { Place } = google.maps.places;

        try {
            const result = await Place.searchNearby({
                fields: ["id", "displayName", "location", "formattedAddress"],
                includedTypes: [type], // giống như type: ['restaurant']
                locationRestriction: {
                    center: position,
                    radius: 2000
                },
            });

            const enriched = result.places.map((p) => ({
                ...p,
                name: p.displayName,
                vicinity: p.formattedAddress,
                geometry: { location: p.location },
                distance: calcDistance(
                    position.lat,
                    position.lng,
                    p.location.lat(),
                    p.location.lng(),
                ),
            }));

            console.log(result.places[0].distance)

            setPlaces(enriched);

        } catch (err) {
            console.error("Nearby search error", err);
        }
    };


    // tính khoảng cách mét
    const calcDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // m
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // khi đổi tab
    const handleSelectType = (type) => {
        setActiveType(type);
        loadPlaces(type);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Map location</CardTitle></CardHeader>
            <CardContent>
                <MapContainer onLoad={onMapLoad} center={position} style={{ height: "350px", width: "100%", cursor: "default" }} zoom={15}>
                    <Marker key={property._id} position={position} />

                    {/* Marker tiện ích */}
                    {places.map((p) => (
                        // <Marker
                        //     key={p.place_id}
                        //     position={p.geometry.location}
                        //     icon={{
                        //         url: p.icon || ICONS[activeType],
                        //         scaledSize: new google.maps.Size(30, 30),
                        //     }}
                        // />
                        <CustomOverlayMarker position={p.geometry.location} type={activeType} onClick={() => setSelected(p)} />
                    ))}

                    {/* Popup info */}
                    {selected && (
                        <InfoWindow
                            position={selected.geometry.location}
                            onCloseClick={() => setSelected(null)}
                        >
                            <div>
                                <strong>{selected.name}</strong>
                                <br />
                                {selected.vicinity}
                            </div>
                        </InfoWindow>
                    )}
                </MapContainer>

                {/* Tabs */}
                <div className="flex justify-between overflow-x-auto pt-4">
                    {tabs.map((tab, index) => (
                        <div className="w-full">
                            <div
                                key={tab.key}
                                className={`w-full flex items-center justify-center cursor-pointer gap-2 px-4 py-2 transition rounded-sm ${activeType === tab.key
                                    ? "text-teal-700 font-medium"
                                    : "text-gray-700 hover:bg-teal-50"
                                    }`}
                                onClick={() => handleSelectType(tab.key)}
                            >
                                <tab.icon.type size={16} />
                                {tab.label}
                            </div>
                            <Separator key={index} className={`h-2 my-1 ${activeType === tab.key
                                ? "bg-teal-700"
                                : ""
                                }`} />
                        </div>
                    ))}
                </div>

                {/* Danh sách tiện ích */}
                <div className="mt-0 h-[300px] overflow-y-auto">
                    <p className="text-gray-500 mb-2">
                        Có {places.length} địa điểm trong vòng 2 km
                    </p>

                    {places.map((p) => (
                        <div key={p.place_id} className="border-b py-4">
                            <div className="flex items-center justify-between gap-3">

                                {/* ICON bên trái */}
                                <div
                                    className={`${typeMetaData.color} rounded-sm w-8 h-8 flex items-center justify-center flex-shrink-0`}
                                >
                                    <typeMetaData.icon.type className='w-4 h-4' color="white" strokeWidth={2} />
                                </div>

                                {/* THÔNG TIN ĐỊA CHỈ ở giữa */}
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{p.name}</div>
                                    <div className="text-gray-500 text-xs">{p.vicinity}</div>
                                </div>

                                {/* KHOẢNG CÁCH + THỜI GIAN bên phải */}
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-medium">{p.distance.toFixed(0)} m</div>
                                    <div className="text-xs">~ {Math.round(p.distance / 80)} phút</div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}