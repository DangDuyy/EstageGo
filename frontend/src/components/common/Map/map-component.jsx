import { geocodeAddress } from "@/apis";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
    width: '100%',
    height: '400px'
};

// const center = {
//     lat: 10.8231, // ví dụ: TPHCM
//     lng: 106.6297
// };

export default function MapComponent({ form, address }) {
    const [position, setPosition] = useState()
    const [center, setCenter] = useState({
        lat: 10.8231, // ví dụ: TPHCM
        lng: 106.6297
    })
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY
    });

    useEffect(() => {
        async function handleSearch() {
            try {
                if (!address.trim()) return

                const response = await geocodeAddress(address)
                console.log(response)
                const loc = response[0].geometry.location // lat, lng
                console.log(loc.lat(),loc.lng())
                form.setValue('address.location.coordinates', [loc.lng(), loc.lat()])
                setPosition(loc)
                setCenter(loc)
            }
            catch (e) {
                console.log(e)
            }
        }

        handleSearch()
    }, [address])

    if (!isLoaded) return null;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
        >
            <Marker position={position} />
        </GoogleMap>
    );
}
