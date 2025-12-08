import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MapsContext } from "./MapProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapContainer from "./MapContainer";
import { DirectionsRenderer, InfoWindow, Marker } from "@react-google-maps/api";
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
    const [travelInfo, setTravelInfo] = useState([]);
    const [route, setRoute] = useState(null);



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
                includedTypes: [type],
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
            }));

            setPlaces(enriched);

            // 🎯 GỌI DISTANCE MATRIX
            loadDistanceMatrix(enriched);

        } catch (err) {
            console.error("Nearby search error", err);
        }
    };



    const loadDistanceMatrix = (placesList) => {
        if (!google || !google.maps) return;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [position],
                destinations: placesList.map((p) => p.geometry.location),
                travelMode: google.maps.TravelMode.DRIVING, // hoặc WALKING, BICYCLING, TRANSIT
                unitSystem: google.maps.UnitSystem.METRIC,
            },
            (response, status) => {
                if (status !== "OK") {
                    console.error("Distance Matrix error:", status);
                    return;
                }

                const rows = response.rows[0].elements;

                // gán vào state travelInfo
                setTravelInfo(rows);
            }
        );
    };

    const calculateRoute = (destination) => {
        if (!google || !google.maps) return;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
            {
                origin: position,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,  // WALKING, BICYCLING, TRANSIT
            },
            (result, status) => {
                if (status === "OK") {
                    setRoute(result);
                } else {
                    console.error("Directions request failed:", status);
                }
            }
        );
    };

    useEffect(() => {
        setRoute(null)
    }, [activeType])


    // khi đổi tab
    const handleSelectType = (type) => {
        setActiveType(type);
        loadPlaces(type);
    };

    return (
        <section className="space-y-3 pb-6">
            <h3 className="text-xl font-semibold">Map location</h3>

            <div className="space-y-3 border border-accent rounded-md overflow-hidden">
              <MapContainer onLoad={onMapLoad} center={position} style={{ height: "350px", width: "100%", cursor: "default" }} zoom={15}>
                    <Marker key={property._id} position={position} />

                    {/* Marker tiện ích */}
                    {places.map((p) => (
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

                    {route && (
                        <DirectionsRenderer
                            directions={route}
                            options={{
                                suppressMarkers: true,
                                polylineOptions: {
                                    strokeColor: "#0ea5e9", // màu xanh đẹp
                                    strokeWeight: 5,
                                },
                            }}
                        />
                    )}

                </MapContainer>

                {/* Tabs */}
                <div className="flex justify-between overflow-x-auto p-4 pb-0">
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
                <div className="mt-0 h-[300px] overflow-y-auto px-4">
                    <p className="text-muted-foreground mb-2 px-2 text-sm">
                        Có {places.length} địa điểm trong vòng 2 km
                    </p>

                    {places.map((p, index) => (
                        <div
                            key={p.place_id}
                            onClick={() => calculateRoute(p.geometry.location)}
                            className="
        border-b 
        py-4 
        px-2 
        transition 
        cursor-pointer
        hover:bg-muted/40 
        rounded-sm
      "
                        >
                            <div className="flex items-center justify-between gap-3">

                                {/* ICON bên trái */}
                                <div
                                    className={`
            ${typeMetaData.color} 
            rounded-md 
            w-8 h-8 
            flex items-center justify-center 
            flex-shrink-0
            shadow-sm
          `}
                                >
                                    <typeMetaData.icon.type
                                        className="w-4 h-4 text-white"
                                        strokeWidth={2}
                                    />
                                </div>

                                {/* THÔNG TIN ĐỊA CHỈ */}
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">
                                        {p.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {p.vicinity}
                                    </div>
                                </div>

                                {/* KHOẢNG CÁCH + THỜI GIAN */}
                                <div className="text-right flex-shrink-0">
                                    {travelInfo[index] && travelInfo[index].status === "OK" ? (
                                        <>
                                            <div className="text-sm font-medium text-foreground">
                                                {travelInfo[index].distance.text}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {travelInfo[index].duration.text}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-sm text-muted-foreground">--</div>
                                            <div className="text-xs text-muted-foreground">--</div>
                                        </>
                                    )}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
    )
}