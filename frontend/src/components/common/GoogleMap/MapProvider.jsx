import { useJsApiLoader } from "@react-google-maps/api"
import { createContext } from "react"

// eslint-disable-next-line react-refresh/only-export-components
export const MapsContext = createContext({loaded: false, google: null})

export const MapProvider = ({apiKey, children, libraries = ["places"]}) => {
    const {isLoaded, loadError} = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
        // language, region, mapIds can be passed here but avoid changing options at runtime
    })

    return (
        <MapsContext.Provider value={{loaded: isLoaded, loadError, google: window.google}}>
            {children}
        </MapsContext.Provider>
    )
}