import React, { useState, useRef, useEffect, useContext } from "react";
import { MapsContext } from "./MapProvider";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CustomSearchBox({ onPlaceSelected }) {
  const { loaded, google } = useContext(MapsContext);
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const debounceTimer = useRef(null);
  const autocompleteService = useRef(null);
  const sessionToken = useRef(null);

  // Khởi tạo AutocompleteService khi google load xong
  useEffect(() => {
    if (!loaded || !google) return;

    autocompleteService.current = new google.maps.places.AutocompleteService();
    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
  }, [loaded, google]);

  const fetchPredictions = (value) => {
    if (!value || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        sessionToken: sessionToken.current,
        componentRestrictions: { country: "vn" }, // Giới hạn Việt Nam
      },
      (preds, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
          setPredictions(preds);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleValueChange = (value) => {
    setInputValue(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchPredictions(value), 300);
  };

  const handleSelect = (prediction) => {
    setInputValue(prediction.description);
    setPredictions([]);

    if (!google) return;

    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    service.getDetails({ placeId: prediction.place_id }, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        onPlaceSelected({
          name: result.name,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address,
        });
      }
    });

    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
  };

  if (!loaded) return <div>Loading map...</div>;

  return (
    <div className="relative w-full">
      {/* Input với icon Search */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search places..."
          value={inputValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-12 pl-12 rounded-full"
        />
      </div>

      {/* Dropdown gợi ý */}
      {predictions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
          {predictions.map((prediction) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {prediction.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
