import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { OverlayView } from "@react-google-maps/api";
import PropertyCard from "../Property/FeatureCard/PropertyCard";
import { useState } from "react";
import { fetchPropertyDetail } from "@/apis";

function PropertyMarker({ property }) {
    const position = { lat: property.address?.location?.coordinates[1], lng: property.address?.location?.coordinates[0] }
    const [propertyDetail, setPropertyDetail] = useState(null)

    const getPropertyDetail = async () => {
        const res = await fetchPropertyDetail(property._id)
        setPropertyDetail(res)
    }

    return (
        <OverlayView
            key={property._id}
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="relative pointer-events-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div onClick={getPropertyDetail}
                            className="
                        w-3.5 h-3.5 bg-red-700 rounded-full border-2 border-white
                        shadow-xl -translate-x-1/2 -translate-y-1/2
                        hover:bg-green-700
                    "
                        />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="m-0 p-0 border-0"
                    >
                        {propertyDetail && <PropertyCard item={propertyDetail} /> }
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </OverlayView>

    );
}

export default PropertyMarker;
