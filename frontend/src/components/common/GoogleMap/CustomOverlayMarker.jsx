import React from "react";
import { OverlayView } from "@react-google-maps/api";
import {
    Utensils,
    School,
    Coffee,
    Hospital,
    Banknote,
    Fuel,
    ShoppingBag,
    Pill,
    Landmark,
    Car,
    Dumbbell,
    Shirt,
    Film,
    TreePine,
    Library,
    GraduationCap,
    Baby,
    Bluetooth,
    Wine,
    Building2,
    Bus,
    Bike,
} from "lucide-react";

// size tính toán
const size = 30
const outer = size;            // vòng ngoài
const inner = size * 0.8;     // vòng màu
const iconSize = size * 0.4;   // icon bên trong
const tail = size * 0.2;       // chiều cao giọt nước

const MARKER_TYPES = {
    // ĂN UỐNG
    restaurant: {
        color: "bg-orange-600",
        icon: <Utensils size={iconSize} color="white" strokeWidth={2} />,
    },
    cafe: {
        color: "bg-purple-600",
        icon: <Coffee size={iconSize} color="white" strokeWidth={2} />,
    },
    bar: {
        color: "bg-rose-600",
        icon: <Wine size={iconSize} color="white" strokeWidth={2} />,
    },
    bakery: {
        color: "bg-yellow-600",
        icon: <Baby size={iconSize} color="white" strokeWidth={2} />,
    },

    // MUA SẮM
    supermarket: {
        color: "bg-green-600",
        icon: <ShoppingBag size={iconSize} color="white" strokeWidth={2} />,
    },
    clothing_store: {
        color: "bg-blue-500",
        icon: <Shirt size={iconSize} color="white" strokeWidth={2} />,
    },
    convenience_store: {
        color: "bg-emerald-600",
        icon: <ShoppingBag size={iconSize} color="white" strokeWidth={2} />,
    },

    // SỨC KHOẺ
    hospital: {
        color: "bg-red-600",
        icon: <Hospital size={iconSize} color="white" strokeWidth={2} />,
    },
    pharmacy: {
        color: "bg-pink-600",
        icon: <Pill size={iconSize} color="white" strokeWidth={2} />,
    },
    dentist: {
        color: "bg-indigo-600",
        icon: <Bluetooth size={iconSize} color="white" strokeWidth={2} />,
    },
    doctor: {
        color: "bg-red-500",
        icon: <Hospital size={iconSize} color="white" strokeWidth={2} />,
    },

    // GIÁO DỤC
    school: {
        color: "bg-blue-600",
        icon: <School size={iconSize} color="white" strokeWidth={2} />,
    },
    university: {
        color: "bg-sky-700",
        icon: <GraduationCap size={iconSize} color="white" strokeWidth={2} />,
    },
    library: {
        color: "bg-teal-600",
        icon: <Library size={iconSize} color="white" strokeWidth={2} />,
    },

    // TÀI CHÍNH
    bank: {
        color: "bg-slate-700",
        icon: <Banknote size={iconSize} color="white" strokeWidth={2} />,
    },
    atm: {
        color: "bg-gray-800",
        icon: <Banknote size={iconSize} color="white" strokeWidth={2} />,
    },

    // TIỆN ÍCH – GIAO THÔNG
    gas_station: {
        color: "bg-yellow-700",
        icon: <Fuel size={iconSize} color="white" strokeWidth={2} />,
    },
    bus_station: {
        color: "bg-cyan-700",
        icon: <Bus size={iconSize} color="white" strokeWidth={2} />,
    },
    parking: {
        color: "bg-indigo-700",
        icon: <Car size={iconSize} color="white" strokeWidth={2} />,
    },
    bicycle_store: {
        color: "bg-lime-700",
        icon: <Bike size={iconSize} color="white" strokeWidth={2} />,
    },

    // GIẢI TRÍ
    movie_theater: {
        color: "bg-red-700",
        icon: <Film size={iconSize} color="white" strokeWidth={2} />,
    },
    museum: {
        color: "bg-purple-700",
        icon: <Landmark size={iconSize} color="white" strokeWidth={2} />,
    },
    park: {
        color: "bg-green-700",
        icon: <TreePine size={iconSize} color="white" strokeWidth={2} />,
    },

    // DỊCH VỤ KHÁC
    gym: {
        color: "bg-gray-700",
        icon: <Dumbbell size={iconSize} color="white" strokeWidth={2} />,
    },
    spa: {
        color: "bg-pink-500",
        icon: <Baby size={iconSize} color="white" strokeWidth={2} />,
    },

    // fallback
    default: {
        color: "bg-gray-600",
        icon: <Building2 size={iconSize} color="white" strokeWidth={2} />,
    },
};


export default function CustomOverlayMarker({ position, type = "restaurant", onClick }) {
    const { color, icon : Icon } = MARKER_TYPES[type] || MARKER_TYPES["restaurant"];

    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                onClick={onClick}
                className="relative cursor-pointer -translate-x-1/2 -translate-y-full flex flex-col items-center"
            >
                {/* Outer circle */}
                <div
                    className="bg-white rounded-full shadow-md relative flex items-center justify-center"
                    style={{ width: outer, height: outer }}
                >
                    {/* Inner colored circle */}
                    <div
                        className={`${color} rounded-full flex items-center justify-center`}
                        style={{ width: inner, height: inner }}
                    >
                        <Icon.type size={iconSize} color="white" strokeWidth={2} />
                    </div>

                    {/* Tail */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                            bottom: -tail * 0.8,
                            width: 0,
                            height: 0,
                            borderLeft: `${tail}px solid transparent`,
                            borderRight: `${tail}px solid transparent`,
                            borderTop: `${tail * 1.2}px solid white`,
                        }}
                    />
                </div>
            </div>
        </OverlayView>
    );
}
