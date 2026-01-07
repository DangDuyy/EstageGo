import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { OverlayView } from "@react-google-maps/api";
import PropertyCard from "../Property/FeatureCard/PropertyCard";
import { useState } from "react";
import { fetchPropertyDetail } from "@/apis";
import { Sparkles } from "lucide-react";

function PropertyMarker({ property }) {
    const position = { lat: property.address?.location?.coordinates[1], lng: property.address?.location?.coordinates[0] }
    const [propertyDetail, setPropertyDetail] = useState(null)

    const getPropertyDetail = async () => {
        const res = await fetchPropertyDetail(property._id)
        console.log('Property detail from API:', res)
        console.log('Owner info:', res.ownerInfo)
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
                        <div
                            onClick={getPropertyDetail}
                            className={`
                            absolute
                            flex items-center justify-center
                            ${!property.isFeatured ? "w-4 h-4" : "w-5 h-5"}
                            ${!property.isFeatured ? "" : "z-50"}
                            bg-red-700
                            rounded-full
                            border-2 border-white
                            shadow-md
                            cursor-pointer
                            -translate-x-1/2 -translate-y-1/2
                            hover:bg-green-700
                          `}
                        >
                            {property.isFeatured && <Sparkles className="w-2 h-2 text-white fill-white" />}
                        </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="p-0 border-0 w-[320px] max-w-[90vw]"
                        align="start"
                        side="top"
                        sideOffset={10}
                    >
                        {propertyDetail && <PropertyCard item={propertyDetail} view="grid" />}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </OverlayView>

    );
}

export default PropertyMarker;
