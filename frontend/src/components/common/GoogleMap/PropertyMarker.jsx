import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { OverlayView } from "@react-google-maps/api";
import PropertyCard from "../Property/FeatureCard/PropertyCard";

function PropertyMarker({ property }) {
    const position = { lat: property.address?.location?.coordinates[1], lng: property.address?.location?.coordinates[0] }
    return (
        <OverlayView key={property._id} position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div
                        className="
                          w-3.5 h-3.5
                          bg-red-700
                          hover:bg-green-700
                          rounded-full
                          border-2 border-white
                          shadow-xl
                          -translate-x-1/2 -translate-y-1/2
                        "
                        style={{
                            boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.9)"
                        }}
                        onClick={() => { console.log("aslgkja;shg;asjdg;lajsgl;jasl;dgjasldgj") }}
                    >

                    </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent className={'m-0 p-0 border-0'} asChild>
                    <PropertyCard
                        key={property._id}
                        item={property}
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </OverlayView>
    );
}

export default PropertyMarker;
