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

export const MARKER_TYPES = {
    // ĂN UỐNG
    restaurant: {
        color: "bg-orange-600",
        icon: <Utensils color="white" strokeWidth={2} />,
    },
    cafe: {
        color: "bg-purple-600",
        icon: <Coffee color="white" strokeWidth={2} />,
    },
    bar: {
        color: "bg-rose-600",
        icon: <Wine color="white" strokeWidth={2} />,
    },
    bakery: {
        color: "bg-yellow-600",
        icon: <Baby color="white" strokeWidth={2} />,
    },

    // MUA SẮM
    supermarket: {
        color: "bg-green-600",
        icon: <ShoppingBag color="white" strokeWidth={2} />,
    },
    clothing_store: {
        color: "bg-blue-500",
        icon: <Shirt color="white" strokeWidth={2} />,
    },
    convenience_store: {
        color: "bg-emerald-600",
        icon: <ShoppingBag color="white" strokeWidth={2} />,
    },

    // SỨC KHOẺ
    hospital: {
        color: "bg-red-600",
        icon: <Hospital color="white" strokeWidth={2} />,
    },
    pharmacy: {
        color: "bg-pink-600",
        icon: <Pill color="white" strokeWidth={2} />,
    },
    dentist: {
        color: "bg-indigo-600",
        icon: <Bluetooth color="white" strokeWidth={2} />,
    },
    doctor: {
        color: "bg-red-500",
        icon: <Hospital color="white" strokeWidth={2} />,
    },

    // GIÁO DỤC
    school: {
        color: "bg-blue-600",
        icon: <School color="white" strokeWidth={2} />,
    },
    university: {
        color: "bg-sky-700",
        icon: <GraduationCap color="white" strokeWidth={2} />,
    },
    library: {
        color: "bg-teal-600",
        icon: <Library color="white" strokeWidth={2} />,
    },

    // TÀI CHÍNH
    bank: {
        color: "bg-slate-700",
        icon: <Banknote color="white" strokeWidth={2} />,
    },
    atm: {
        color: "bg-gray-800",
        icon: <Banknote color="white" strokeWidth={2} />,
    },

    // TIỆN ÍCH – GIAO THÔNG
    gas_station: {
        color: "bg-yellow-700",
        icon: <Fuel color="white" strokeWidth={2} />,
    },
    bus_station: {
        color: "bg-cyan-700",
        icon: <Bus color="white" strokeWidth={2} />,
    },
    parking: {
        color: "bg-indigo-700",
        icon: <Car color="white" strokeWidth={2} />,
    },
    bicycle_store: {
        color: "bg-lime-700",
        icon: <Bike color="white" strokeWidth={2} />,
    },

    // GIẢI TRÍ
    movie_theater: {
        color: "bg-red-700",
        icon: <Film color="white" strokeWidth={2} />,
    },
    museum: {
        color: "bg-purple-700",
        icon: <Landmark color="white" strokeWidth={2} />,
    },
    park: {
        color: "bg-green-700",
        icon: <TreePine color="white" strokeWidth={2} />,
    },

    // DỊCH VỤ KHÁC
    gym: {
        color: "bg-gray-700",
        icon: <Dumbbell color="white" strokeWidth={2} />,
    },
    spa: {
        color: "bg-pink-500",
        icon: <Baby color="white" strokeWidth={2} />,
    },

    // fallback
    default: {
        color: "bg-gray-600",
        icon: <Building2 color="white" strokeWidth={2} />,
    },
};