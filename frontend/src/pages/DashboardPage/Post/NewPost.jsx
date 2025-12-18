/* eslint-disable no-unused-vars */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import ImageUploadComponent from "@/components/common/Upload/uploadImage";
import { createProperty, getAllProvinces, getBalanceAPI, getDistrict, getListingTiers, getWard, verifyPropertyDocumentsAPI } from "@/apis";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema } from "@/schemas/property.schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TourLinkModal from "@/components/common/Upload/tour-link-modal";
import MapContainer from "@/components/common/GoogleMap/MapContainer";
import { MapsContext } from "@/components/common/GoogleMap/MapProvider";
import MarkerLayer from "@/components/common/GoogleMap/MarkerLayer";
import CustomSearchBox from "@/components/common/GoogleMap/SearchBox";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { Check, X } from "lucide-react";

// ----- Mock data -----
const propertyTypes = ["Apartment", "Villa", "Studio", "Office", "Townhouse"];
const currencies = ['VND', 'USD', 'EUR']
const period = ['month', 'year', 'other']

// DỮ LIỆU MOCK CHO PLAN LISTING
const planInfo = {
    basic: { label: 'Basic Listing', discount: 0, expirySale: 30, expiryRent: 15 },
    standard: { label: 'Standard Listing', discount: 10, expirySale: 60, expiryRent: 30 },
    premium: { label: 'Premium Listing', discount: 30, expirySale: 90, expiryRent: 45 },
};
const planOrder = { basic: 1, standard: 2, premium: 3 };


// ----- Utils -----
const currency = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

// Helper to normalize strings for comparison (removes 'Thành phố', 'Tỉnh')
const normalizeName = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/thành phố|tỉnh|quận|huyện|phường|xã/g, "")
        .trim();
};

function Stepper({ step, setStep }) {
    const items = ["Listing Details", "Verify Documents", "Agent & Payment"];
    return (
        <div className="mb-8">
            <div className="grid grid-cols-3 border-b">
                {items.map((label, i) => {
                    const idx = i + 1;
                    const active = step === idx;
                    const complete = step > idx;
                    return (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setStep(idx)}
                            className={cn(
                                "relative px-4 py-4 text-left transition-colors",
                                active && "text-primary font-semibold",
                                complete && "text-foreground/80"
                            )}
                        >
                            <div className="text-sm uppercase tracking-wide opacity-70">Step {idx}</div>
                            <div className="text-base">{label}</div>
                            <div
                                className={cn(
                                    "absolute -bottom-[2px] left-0 right-0 h-[2px] bg-transparent",
                                    active && "bg-primary"
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const propertyDefaultValue = {
    title: '',
    description: '',
    area: 0,
    type: '',
    address: {
        province: '',
        district: '',
        ward: '',
        street: '',
        location: {
            coordinates: []
        }
    },
    price: {
        value: 0,
        currency: 'VND',
        period: 'month'
    },
    purpose: 'sale',
    visibility: 'public',
    rooms: {
        bedrooms: 0,
        bathrooms: 0,
        livingrooms: 0,
        kitchens: 0,
    },
    files: [],
    yearBuilt: new Date().getFullYear(),
}

export default function AddPropertyWizard() {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser)
    const membershipLevel = currentUser.membershipLevel
    // 🚨 THÊM BALANCE CỦA NGƯỜI DÙNG TỪ REDUX
    const currentBalance = getBalanceAPI()
    const { loaded } = useContext(MapsContext);

    // ----- Step control -----
    const [step, setStep] = useState(1);

    // ----- Phone verify (Step 1) -----
    const [phoneModalOpen, setPhoneModalOpen] = useState(true);
    const [phone, setPhone] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(true);

    // ----- Listing info (Step 1) -----
    const [visibility, setVisibility] = useState("public");

    const [fullAddress, setFullAddress] = useState("");
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const skipGeocodeRef = useRef(false);

    // ----- Documents + Payment (Step 2 & 3) -----
    const [houseDocs, setHouseDocs] = useState([]);
    const [idDocs, setIdDocs] = useState([]);
    const [docsVerificationResult, setDocsVerificationResult] = useState(null);
    const [isVerifyingDocs, setIsVerifyingDocs] = useState(false);
    const docsUploaded = houseDocs.length > 0 && idDocs.length > 0;
    const docsValid = Boolean(
        docsVerificationResult?.cccdVerified && docsVerificationResult?.houseDocVerified
    );
    const [selectedPlan, setSelectedPlan] = useState(membershipLevel);

    // 🚨 STATE MỚI CHO DIALOG LỖI THANH TOÁN
    const [depositDialogOpen, setDepositDialogOpen] = useState(false);
    const [requiredFee, setRequiredFee] = useState(0);
    const [serverMsg, setServerMsg] = useState("");


    // ----- Map State (Step 1) -----
    const [center, setCenter] = useState({ lat: 10.762622, lng: 106.660172 });
    const [results, setResults] = useState([]);


    // react-hook-form setup
    const form = useForm({
        defaultValues: propertyDefaultValue,
        resolver: zodResolver(propertySchema),
        mode: 'onBlur',
    })

    // Watch values for fee calculation and address change
    const [
        priceValue,
        purposeValue,
        province,
        district,
        ward,
        street,
        areaValue
    ] = form.watch([
        'price.value',
        'purpose',
        'address.province',
        'address.district',
        'address.ward',
        'address.street',
        'area'
    ]);

    // Update visibility form value
    useEffect(() => {
        form.setValue('visibility', visibility);
    }, [visibility, form]);

    // Update price.period when purpose changes (for rent default)
    useEffect(() => {
        if (purposeValue === 'sale') {
            form.setValue('price.period', 'other');
        } else if (purposeValue === 'rent' && form.getValues('price.period') === 'other') {
            form.setValue('price.period', 'month');
        }
    }, [purposeValue, form]);

    // Memoize listing fee calculation helpers
    const computeBase = (v, isRent) => {
        if (isRent) {
            if (v < 10_000_000) return 150_000;
            if (v <= 30_000_000) return 300_000;
            return 600_000;
        }
        if (v < 500_000_000) return 300_000;
        if (v <= 2_000_000_000) return 600_000;
        return 1_000_000;
    };

    const discounts = { basic: 0, standard: 10, premium: 30 };

    // CẬP NHẬT LOGIC TÍNH PHÍ DỰA TRÊN selectedPlan
    const listingFee = useMemo(() => {
        const plan = planInfo[selectedPlan] || planInfo[membershipLevel] || planInfo.basic;
        const v = Number(priceValue || 0);
        const base = computeBase(v, purposeValue === 'rent');
        const discount = plan.discount || 0;
        return Math.round(base * (1 - discount / 100));
    }, [priceValue, purposeValue, selectedPlan, membershipLevel]);

    // Address fingerprint for re-verification check
    const addressFingerprint = useMemo(
        () => [province, district, ward, street, areaValue].join('|'),
        [province, district, ward, street, areaValue]
    )
    const addressFingerprintRef = useRef(addressFingerprint)

    // Reset document verification status if address/area changes
    useEffect(() => {
        if (addressFingerprintRef.current !== addressFingerprint && docsVerificationResult) {
            setDocsVerificationResult(null)
        }
        addressFingerprintRef.current = addressFingerprint
    }, [addressFingerprint, docsVerificationResult])


    // Utility functions for form and docs
    const buildPropertyVerificationPayload = useCallback(() => {
        const snapshot = form.getValues()
        return {
            title: snapshot.title,
            area: snapshot.area,
            purpose: snapshot.purpose,
            price: snapshot.price,
            address: snapshot.address || {}
        }
    }, [form])

    function handleDocsChange(kind, files) {
        if (!files) return;
        const arr = Array.from(files);
        if (kind === "house") setHouseDocs(arr);
        else setIdDocs(arr);
        setDocsVerificationResult(null);
    }

    // Google Maps utility functions
    const getAddressComponent = (components = [], type) =>
        components.find((c) => c.types.includes(type))?.long_name || "";

    const populateAddressFromComponents = useCallback((components = [], fallbackStreet = "") => {
        const mapsProvinceName = getAddressComponent(components, "administrative_area_level_1");
        const mapsDistrictName = getAddressComponent(components, "administrative_area_level_2");
        const mapsWardName =
            getAddressComponent(components, "administrative_area_level_3") ||
            getAddressComponent(components, "sublocality_level_1");
        const streetNumber = getAddressComponent(components, "street_number");
        const routeName = getAddressComponent(components, "route");
        const streetValue = [streetNumber, routeName].filter(Boolean).join(" ") || fallbackStreet;

        const newValues = {};

        // 1. CHUẨN HÓA VÀ ĐỐI CHIẾU TỈNH/THÀNH PHỐ
        if (mapsProvinceName) {
            const normalizedMapsProvince = normalizeName(mapsProvinceName);
            const matchingProvince = provinces.find(p => normalizeName(p.name) === normalizedMapsProvince || p.name === mapsProvinceName);
            if (matchingProvince) {
                newValues['address.province'] = matchingProvince.name;
            } else {
                newValues['address.province'] = mapsProvinceName;
            }
        }

        if (mapsDistrictName) newValues['address.district'] = mapsDistrictName;
        if (mapsWardName) newValues['address.ward'] = mapsWardName;
        if (streetValue) newValues['address.street'] = streetValue;

        // Apply changes
        Object.entries(newValues).forEach(([key, value]) => {
            if (form.getValues(key) !== value) {
                form.setValue(key, value, { shouldDirty: true });
            }
        });
    }, [form, provinces]);


    const handleGeocodeSuccess = useCallback(
        (results, { updateFullAddress = false } = {}) => {
            if (!results || results.length === 0) return;

            const markers = results.map((r, index) => ({
                id: r.place_id || index,
                lat: r.geometry.location.lat(),
                lng: r.geometry.location.lng(),
                address: r.formatted_address,
            }));

            setResults(markers);

            const primary = results[0];
            const loc = primary.geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();

            setCenter({ lat, lng });
            form.setValue("address.location.coordinates", [lng, lat], { shouldDirty: true });

            populateAddressFromComponents(primary.address_components, primary.formatted_address);

            if (updateFullAddress && primary.formatted_address) {
                skipGeocodeRef.current = true;
                setFullAddress(primary.formatted_address);
            }
        },
        [form, populateAddressFromComponents]
    );

    const reverseGeocodeCoordinates = useCallback(
        (lat, lng) => {
            if (!loaded || !window.google) return;
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK") {
                    handleGeocodeSuccess(results, { updateFullAddress: true });
                } else {
                    console.error("Reverse geocode failed:", status);
                    toast.error("Reverse geocode failed: " + status);
                }
            });
        },
        [loaded, handleGeocodeSuccess]
    );

    const handlePlaceSelected = (place) => {
        if (!place?.geometry) return;
        const location = place.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const formattedAddress = place.formatted_address || place.name || "";

        setCenter({ lat, lng });
        form.setValue("address.location.coordinates", [lng, lat], { shouldDirty: true });
        setResults([
            {
                id: place.place_id || Date.now(),
                lat,
                lng,
                address: formattedAddress,
            },
        ]);

        populateAddressFromComponents(place.address_components || [], formattedAddress);
        if (formattedAddress) {
            skipGeocodeRef.current = true;
            setFullAddress(formattedAddress);
        }
    };

    const handleMapClick = (event) => {
        const lat = event?.latLng?.lat();
        const lng = event?.latLng?.lng();
        if (lat == null || lng == null) return;
        reverseGeocodeCoordinates(lat, lng);
    };

    const handleMarkerClick = (marker) => {
        if (!marker) return;
        reverseGeocodeCoordinates(marker.lat, marker.lng);
    };

    // Geocode address from form fields
    const handleSearch = () => {
        const fullAddr = [
            street?.trim(),
            ward?.trim(),
            district?.trim(),
            province?.trim()
        ]
            .filter(Boolean)
            .join(', ');

        skipGeocodeRef.current = false;
        setFullAddress(fullAddr);
    }

    // Effect to trigger geocoding when fullAddress changes (unless skipped)
    useEffect(() => {
        if (!fullAddress || !loaded || !window.google) return;

        if (skipGeocodeRef.current) {
            skipGeocodeRef.current = false;
            return;
        }

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === "OK") {
                handleGeocodeSuccess(results, { updateFullAddress: false });
            }
            else {
                console.error("Geocode failed: ", status);
            }
        });
    }, [fullAddress, loaded, handleGeocodeSuccess]);

    // Fetch provinces on mount
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await getAllProvinces()
                setProvinces(response)
            } catch (error) {
                toast.error("Failed to load provinces.");
            }
        }
        fetchProvinces()
    }, [])

    // Update districts when province changes
    useEffect(() => {
        const handleSelectProvince = async (provinceId) => {
            try {
                const response = await getDistrict(provinceId)
                setDistricts(response)
            } catch (error) {
                toast.error("Failed to load districts.");
            }
        }

        const provinceData = provinces.find(p => p.name === province)
        if (!provinceData) {
            setDistricts([]);
            form.setValue('address.district', '');
            return
        }
        handleSelectProvince(provinceData.id)
        form.setValue('address.district', ''); // Reset district when province changes
    }, [province, provinces, form])

    // Update wards when district changes
    useEffect(() => {
        const handleSelectDistrict = async (districtId) => {
            try {
                const response = await getWard(districtId)
                setWards(response)
            } catch (error) {
                toast.error("Failed to load districts.");
            }
        }

        const districtSelected = districts.find(d => d.name === district)
        if (!districtSelected) {
            setWards([]);
            form.setValue('address.ward', '');
            return;
        }

        handleSelectDistrict(districtSelected.id)
        form.setValue('address.ward', '') // Reset ward when district changes
    }, [district, districts, form])

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    // Phone verification modal
    useEffect(() => {
        setPhoneModalOpen(!isPhoneVerified);
    }, [isPhoneVerified]);

    // Step continuation handlers
    const handleContinueFromStep1 = async () => {
        const isValid = await form.trigger([
            "title",
            "description",
            "address.province",
            "address.district",
            "address.ward",
            "address.street",
            "price.value",
            "price.currency",
            "type",
            "purpose",
            "area",
            "rooms.bedrooms",
            "rooms.bathrooms",
            "rooms.livingrooms",
            "rooms.kitchens",
            "yearBuilt"
        ]);

        if (!isValid) {
            toast.error("Please complete the required fields and fix errors before continuing.");
            return;
        }

        const coords = form.getValues("address.location.coordinates");
        if (!coords || coords.length !== 2 || (coords[0] === 0 && coords[1] === 0)) {
            toast.error("Please confirm the property location on the map.");
            return;
        }

        setStep(2);
    };

    const handleContinueFromStep2 = () => {
        if (!docsValid) {
            toast.error("Please complete AI verification.")
            return
        }
        setSelectedPlan(membershipLevel);
        setStep(3)
    };

    // Document verification API call
    const handleVerifyDocuments = async () => {
        if (!docsUploaded) {
            toast.error("Please upload both ID and house documents before verifying.");
            return;
        }

        try {
            setIsVerifyingDocs(true);
            setDocsVerificationResult(null);
            const payload = new FormData();
            idDocs.forEach(file => payload.append("idDocs", file));
            houseDocs.forEach(file => payload.append("houseDocs", file));
            payload.append("propertyData", JSON.stringify(buildPropertyVerificationPayload()));

            const response = await verifyPropertyDocumentsAPI(payload);
            const analysis = response?.data || {};
            const cccdVerified = Boolean(
                analysis.cccd?.verificationResult?.isUserMatch &&
                analysis.cccd?.verificationResult?.isFormatValid
            );
            const houseDocVerified = Boolean(
                analysis.houseDoc?.verificationResult?.isAddressMatch &&
                analysis.houseDoc?.verificationResult?.isAreaMatch &&
                analysis.houseDoc?.verificationResult?.isFormatValid
            );

            setDocsVerificationResult({
                cccdVerified,
                houseDocVerified,
                cccd: analysis.cccd,
                houseDoc: analysis.houseDoc,
            });

            if (cccdVerified && houseDocVerified) {
                toast.success(response?.message || "Documents verified successfully.");
            } else {
                toast.warn("Verification completed with warnings. Check details below.");
            }

        } catch (error) {
            console.error("Document verification failed:", error);
            const apiData = error?.response?.data?.data;
            setDocsVerificationResult({
                cccdVerified: Boolean(apiData?.cccd?.verificationResult?.isUserMatch),
                houseDocVerified: Boolean(
                    apiData?.houseDoc?.verificationResult?.isAddressMatch &&
                    apiData?.houseDoc?.verificationResult?.isAreaMatch
                ),
                cccd: apiData?.cccd,
                houseDoc: apiData?.houseDoc,
            });
            toast.error(error?.response?.data?.message || "Failed to verify documents. Check details below.");
        } finally {
            setIsVerifyingDocs(false);
        }
    };

    // Dummy SMS send function
    function sendSms() {
        if (!phone.trim()) {
            toast.error("Please enter your phone number.");
            return;
        }
        setIsSending(true);
        // TODO: integrate real SMS API
        setTimeout(() => {
            setIsSending(false);
            setIsPhoneVerified(true);
            setPhoneModalOpen(false);
            toast.success("SMS sent successfully. Phone verified.");
        }, 900);
    }

    // HÀM XỬ LÝ CHỌN PLAN
    const handleSelectPlan = (plan) => {
        if (planOrder[plan] > planOrder[membershipLevel]) {
            toast.warn(`Your current membership (${membershipLevel}) doesn't support the ${planInfo[plan].label} plan. Please upgrade first.`);
        }
        setSelectedPlan(plan);
    };

    // Final submission
    const onSubmit = async (data) => {
        console.log('[onSubmit] data snapshot:', data);
        // if (!docsValid) {
        //     toast.error("Please verify documents first.");
        //     setStep(2);
        //     return;
        // }
        // Extra guard (address & coords)
        const coords = data?.address?.location?.coordinates;
        if (!coords || coords.length !== 2) {
            toast.error("Missing map coordinates.");
            setStep(1);
            return;
        }

        const formData = new FormData();
        for (const key in data) {
            if (key !== "files") {
                const value = data[key];
                if (typeof value === "object" && value !== null) formData.append(key, JSON.stringify(value));
                else formData.append(key, value);
            }
        }
        formData.append("selectedPlan", selectedPlan);
        formData.append("listingFeeClient", String(listingFee));

        formData.append('tierId', selectedTier)
        formData.append('durationId', selectedDuration._id)

        // ONLY listing images
        if (Array.isArray(data.files)) data.files.forEach(f => formData.append("files", f));

        // Note: houseDocs and idDocs files are handled separately in verification and should be excluded from final post unless backend explicitly needs them here again.

        try {
            console.log('[onSubmit] Sending FormData to API');
            await createProperty(formData);
            console.log('[onSubmit] Success');
            toast.success("Listing published.");
            // navigate("/dashboard/posts");
        } catch (error) {
            console.error('[onSubmit] API error:', error);
            const status = error?.response?.status;
            const payload = error?.response?.data;

            // 🚨 XỬ LÝ LỖI 402 PAYMENT REQUIRED
            if (status === 402) {
                const required = Number(payload?.required ?? listingFee);
                setRequiredFee(required);
                setServerMsg(payload?.message || "Insufficient balance to pay listing fee");
                setDepositDialogOpen(true);
                return;
            }

            toast.error(payload?.message || "Failed to publish listing.");
        }
    };


    // Listing Tier new
    const [listingTiers, setListingTiers] = useState()
    const [selectedTier, setSelectedTier] = useState(null)
    const [selectedDuration, setSelectedDuration] = useState({})
    const [durationDialog, setDurationDialog] = useState(false)

    useEffect(() => {
        const fetchListingTiers = async () => {
            const response = await getListingTiers()

            response.forEach((tier) => {
                if (tier.tierName === 'advanced') {
                    tier.title = { text: 'Breakthrough Visibility & Leads', color: 'orange' }
                    tier.description =
                        'A premium solution for sellers and landlords who want to dominate the market, maximize visibility, and attract potential customers immediately after posting.'
                    tier.highlights = [
                        { text: "Display size is double compared to Basic listings", enabled: true },
                        { text: "Includes 4 Top Boosts", enabled: true },
                        { text: "Priority listing displayed at the top of listing pages", enabled: true },
                        // { text: "Free trial of 3 premium services", enabled: true },
                        // { text: "Optional purchase of 3 add-on services (Priority Listing, Boost, Scheduled Boost)", enabled: true, color: "orange" }
                    ]
                    tier.color = 'from-yellow-600/80 to-yellow-800/80'
                }
                else if (tier.tierName === 'boosted') {
                    tier.title = { text: 'Enhanced Exposure', color: 'gray' }
                    tier.description =
                        'A popular solution for sellers and landlords looking to accelerate performance right after posting at a reasonable cost.'
                    tier.highlights = [
                        { text: "Boosted listings are prioritized over Basic listings", enabled: true },
                        { text: "Includes 2 Top Boosts", enabled: true },
                        // { text: "Priority listing displayed at the top of listing pages for 1 day", enabled: false, color: "gray" },
                        // { text: "Free trial of 1 premium service", enabled: true },
                        // { text: "Optional purchase of 3 add-on services (Priority Listing, Boost, Scheduled Boost)", enabled: true, color: "orange" }
                    ]
                    tier.color = 'from-slate-600/80 to-slate-800/80'
                }
                else if (tier.tierName === 'basic') {
                    tier.title = { text: 'Sustained Presence', color: 'gray' }
                    tier.description =
                        'A basic solution for sellers and landlords who want to maintain exposure.'
                    tier.highlights = [
                        { text: "Basic listing", enabled: true },
                        { text: "Includes boost", enabled: false },
                        // { text: "Priority listing displayed at the top of listing pages for 1 day", enabled: false },
                        // { text: "Free trial of premium services", enabled: false },
                        // { text: "Optional purchase of 1 add-on service (Boost)", enabled: true, color: "orange" }
                    ]
                    tier.color = 'from-gray-600/50 to-gray-800/60'
                }
            })

            setListingTiers(response)

            // set default
            const tierDefault = response.filter((t) => t.tierName === 'basic')
            setSelectedTier(tierDefault[0]._id)
            setSelectedDuration(tierDefault[0].durations[0])
        }

        fetchListingTiers()
    }, [])


    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price)
    }

    const handleSelectTier = (tier) => {
        setSelectedTier(tier._id)
        setSelectedDuration(tier.durations[0])
    }

    // ----- Render -----
    return (
        <ContentLayout title="Add Property">
            <Stepper step={step} setStep={setStep} />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {/* STEP 1: Listing Details */}
                    {step === 1 && (
                        <div className="min-h-screen">
                            <Card className="mb-8">
                                <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                                <CardContent className="flex flex-wrap items-center gap-3">
                                    <span
                                        className={cn(
                                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                            isPhoneVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                        )}
                                    >
                                        {isPhoneVerified ? "Phone verified" : "Not verified"}
                                    </span>
                                    <Separator orientation="vertical" className="h-6" />
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm">Visibility</Label>
                                        <div className="rounded-full border p-1">
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={visibility === "public" ? "default" : "ghost"}
                                                    onClick={() => setVisibility("public")}
                                                    className="rounded-full"
                                                >
                                                    Public
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={visibility === "private" ? "default" : "ghost"}
                                                    onClick={() => setVisibility("private")}
                                                    className="rounded-full"
                                                >
                                                    Private
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Media Upload */}
                            <Tabs defaultValue='photos'>
                                <TabsList>
                                    <TabsTrigger value='photos'>Add Photos</TabsTrigger>
                                    <TabsTrigger value='3D'>3D Tour</TabsTrigger>
                                </TabsList>
                                <TabsContent value="photos">
                                    <Controller
                                        name="files"
                                        control={form.control}
                                        render={({ field }) => (
                                            <ImageUploadComponent
                                                className={"mb-8"}
                                                form={form}
                                                files={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="3D">
                                    <TourLinkModal form={form} className={"mb-8"} />
                                </TabsContent>
                            </Tabs>

                            {/* Information */}
                            <Card className="mb-8">
                                <CardHeader><CardTitle>Information</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name='title'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Title</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="3-bedroom townhouse with garden"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name='description'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Write your description..."
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="after:content-['*'] after:text-red-500 after:ml-0.1">Search Location</Label>
                                        <CustomSearchBox onPlaceSelected={handlePlaceSelected} />
                                        <p className="text-xs text-muted-foreground">
                                            Start typing to get Google Maps suggestions or pick a point directly on the map.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* Province */}
                                        <FormField
                                            control={form.control}
                                            name="address.province"
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Province/City</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.address?.province ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select province" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {provinces.map((p) => (
                                                                    <SelectItem key={p.code} value={p.name}>
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />

                                        {/* District */}
                                        <FormField
                                            control={form.control}
                                            name="address.district"
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">District</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                            disabled={!districts.length} // Disable if no districts loaded
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.address?.district ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select district" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {districts.map((d) => (
                                                                    <SelectItem key={d.code} value={d.name}>
                                                                        {d.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Ward */}
                                        <FormField
                                            control={form.control}
                                            name="address.ward"
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Ward</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                            disabled={!wards.length} // Disable if no wards loaded
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.address?.ward ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select ward" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {wards.map((w) => (
                                                                    <SelectItem key={w.code} value={w.name}>
                                                                        {w.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Street */}
                                    <FormField
                                        control={form.control}
                                        name='address.street'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Street</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter house number, street"
                                                        {...field}
                                                        onBlur={() => { field.onBlur(); handleSearch(); }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Display Full Address (Readonly) */}
                                    <div className="grid gap-2">
                                        <Label>Coordinates Address</Label>
                                        <Input
                                            placeholder="Location derived from map coordinates"
                                            disabled
                                            value={fullAddress}
                                        />
                                    </div>

                                    {/* Map */}
                                    <div>
                                        <MapContainer center={center} zoom={13} onClick={handleMapClick}>
                                            <MarkerLayer items={results} onMarkerClick={handleMarkerClick} />
                                        </MapContainer>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Click on the map to update the coordinates or use the search box above.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Price */}
                            <Card className='mb-8'>
                                <CardHeader><CardTitle>Price</CardTitle></CardHeader>
                                <CardContent className='space-y-6'>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Price Value */}
                                        <FormField
                                            control={form.control}
                                            name='price.value'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="Enter price"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div></div> {/* Spacer */}

                                        {/* Currency */}
                                        <FormField
                                            control={form.control}
                                            name="price.currency"
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Currency</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select currency" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {currencies.map((c) => (
                                                                    <SelectItem key={c} value={c}>
                                                                        {c}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Period (Only for rent) */}
                                        {purposeValue === "rent" && (
                                            <FormField
                                                control={form.control}
                                                name="price.period"
                                                render={({ field }) => (
                                                    <FormItem className='relative pb-6'>
                                                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Period</FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                            >
                                                                <SelectTrigger className={cn(
                                                                    "w-full",
                                                                    form.formState.errors.price?.period ? "border-red-500 focus:ring-red-500" : ''
                                                                )}>
                                                                    <SelectValue placeholder="Select period" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {period.filter(p => p !== 'other').map((p) => ( // Filter out 'other' for rent
                                                                        <SelectItem key={p} value={p}>
                                                                            {p.toUpperCase()}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage className='absolute bottom-0' />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Information */}
                            <Card className="mb-8">
                                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* Area */}
                                        <FormField
                                            control={form.control}
                                            name='area'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Area (SqFt)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 1500"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Year Built */}
                                        <FormField
                                            control={form.control}
                                            name='yearBuilt'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Year Built</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 2005"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Living Rooms */}
                                        <FormField
                                            control={form.control}
                                            name='rooms.livingrooms'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Living Room</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 1"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* Kitchens */}
                                        <FormField
                                            control={form.control}
                                            name='rooms.kitchens'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Kitchens</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 1"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Bedrooms */}
                                        <FormField
                                            control={form.control}
                                            name='rooms.bedrooms'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Bedrooms</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 3"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Bathrooms */}
                                        <FormField
                                            control={form.control}
                                            name='rooms.bathrooms'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Bathrooms</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={'number'}
                                                            placeholder="e.g. 2"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* Property Type */}
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Property Type</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.type ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {propertyTypes.map((t) => (
                                                                    <SelectItem key={t} value={t.toLowerCase()}>
                                                                        {t}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Purpose */}
                                        <FormField
                                            control={form.control}
                                            name='purpose'
                                            render={({ field }) => (
                                                <FormItem className='relative pb-6'>
                                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Purpose</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className={cn(
                                                                "w-full",
                                                                form.formState.errors.purpose ? "border-red-500 focus:ring-red-500" : ''
                                                            )}>
                                                                <SelectValue placeholder="Select purpose" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem key={'sale'} value='sale'>Sale</SelectItem>
                                                                <SelectItem key={'rent'} value='rent'>Rent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage className='absolute bottom-0' />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-between">
                                <div />
                                <div className="flex gap-3">
                                    <Button variant="default" type="button" onClick={handleContinueFromStep1}>
                                        Continue to verification
                                    </Button>
                                </div>
                            </div>

                            {/* Phone Verification Modal */}
                            <Dialog open={phoneModalOpen && !isPhoneVerified} onOpenChange={setPhoneModalOpen}>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Verify your phone</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <Label htmlFor="phone">Phone number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+84 912 345 678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            We will send a verification SMS to this number.
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setPhoneModalOpen(false)}>Close</Button>
                                        <Button onClick={sendSms} disabled={isSending}>
                                            {isSending ? "Sending..." : "Send SMS"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* STEP 2: Verify Documents */}
                    {step === 2 && (
                        <div className="min-h-screen">
                            <Card className="mb-8">
                                <CardHeader><CardTitle>Verify documents</CardTitle></CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    {/* House Docs Upload */}
                                    <div className="rounded-lg border border-dashed p-6">
                                        <Label htmlFor="house-docs" className="mb-2 block">
                                            House ownership papers (PDF/JPG/PNG)
                                        </Label>
                                        <Input
                                            id="house-docs"
                                            type="file"
                                            accept=".pdf,image/*"
                                            multiple
                                            onChange={(e) => handleDocsChange("house", e.target.files)}
                                            key={houseDocs.length} // Force re-render input to clear selection on change
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Upload clear scans or photos of the property documents.
                                        </p>
                                        {houseDocs.length > 0 && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {houseDocs.length} file(s) selected
                                            </div>
                                        )}
                                    </div>

                                    {/* ID Docs Upload */}
                                    <div className="rounded-lg border border-dashed p-6">
                                        <Label htmlFor="id-docs" className="mb-2 block">
                                            Owner ID card (front/back) (PDF/JPG/PNG)
                                        </Label>
                                        <Input
                                            id="id-docs"
                                            type="file"
                                            accept=".pdf,image/*"
                                            multiple
                                            onChange={(e) => handleDocsChange("id", e.target.files)}
                                            key={idDocs.length} // Force re-render input to clear selection on change
                                        />
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Upload a valid identification document.
                                        </p>
                                        {idDocs.length > 0 && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {idDocs.length} file(s) selected
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardContent className="space-y-4 border-t pt-6">
                                    {/* AI Verification Control */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-medium">AI verification status</p>
                                            <p className="text-xs text-muted-foreground">
                                                Gemini Vision sẽ đối chiếu CCCD và giấy tờ nhà với dữ liệu bạn nhập ở bước trước.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleVerifyDocuments}
                                            disabled={!docsUploaded || isVerifyingDocs}
                                        >
                                            {isVerifyingDocs
                                                ? "Verifying..."
                                                : docsValid
                                                    ? "Re-run verification"
                                                    : "Verify documents"}
                                        </Button>
                                    </div>

                                    {/* Verification Results */}
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">ID Card (CCCD)</p>
                                            <p className={cn(
                                                "text-sm font-semibold",
                                                docsVerificationResult?.cccdVerified ? "text-green-600" : "text-amber-600"
                                            )}>
                                                {docsVerificationResult?.cccdVerified ? "Verified" : docsVerificationResult ? "Verification Failed" : "Pending verification"}
                                            </p>
                                            {docsVerificationResult?.cccd?.verificationResult?.mismatchDetails && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {docsVerificationResult.cccd.verificationResult.mismatchDetails}
                                                </p>
                                            )}
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">House document</p>
                                            <p className={cn(
                                                "text-sm font-semibold",
                                                docsVerificationResult?.houseDocVerified ? "text-green-600" : "text-amber-600"
                                            )}>
                                                {docsVerificationResult?.houseDocVerified ? "Verified" : docsVerificationResult ? "Verification Failed" : "Pending verification"}
                                            </p>
                                            {docsVerificationResult?.houseDoc?.verificationResult?.mismatchDetails && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {docsVerificationResult.houseDoc.verificationResult.mismatchDetails}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!docsValid && docsVerificationResult && (
                                        <p className="text-xs text-amber-600">
                                            Tải đủ giấy tờ và chạy xác thực AI để mở khóa bước tiếp theo.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-between">
                                <Button variant="outline" type="button" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleContinueFromStep2} disabled={!docsValid || isVerifyingDocs}>
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Agent & Payment */}
                    {step === 3 && (
                        <div>
                            <Card className="mb-6">
                                <CardHeader><CardTitle>Select Listing Plan</CardTitle></CardHeader>
                                <CardContent>
                                    {/* <CardContent className="grid gap-4 md:grid-cols-3"> */}
                                    {/* {(['basic', 'standard', 'premium']).map(p => {
                                        const info = planInfo[p];
                                        const isDefault = p === membershipLevel;
                                        const isSelected = p === selectedPlan;
                                        const v = Number(priceValue || 0);
                                        const base = computeBase(v, purposeValue === 'rent');
                                        const fee = Math.round(base * (1 - (discounts[p] || 0) / 100));
                                        const expiryDays = purposeValue === 'rent' ? info.expiryRent : info.expirySale;

                                        // Kiểm tra xem người dùng có thể chọn plan này không (không cho chọn plan cao hơn membership hiện tại)
                                        const isPlanSelectable = planOrder[p] <= planOrder[membershipLevel];

                                        return (
                                            <div
                                                key={p}
                                                className={cn(
                                                    `border rounded p-4`,
                                                    isPlanSelectable ? 'cursor-pointer hover:shadow-lg transition-shadow' : 'cursor-not-allowed opacity-60',
                                                    isSelected ? 'border-orange-500 ring-2 ring-orange-500' : 'border-muted'
                                                )}
                                                onClick={() => isPlanSelectable && handleSelectPlan(p)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-semibold">{info.label}</div>
                                                    {isDefault && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Your Current Plan</span>}
                                                </div>
                                                <div className="mt-2 text-2xl font-bold">{currency(fee)}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Base: {currency(base)} • Discount: {discounts[p]}%
                                                </div>
                                                <div className="mt-3 text-sm">
                                                    <div>Expiry: **{expiryDays} days**</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {info.label.includes('Premium') && 'Top placement, boosted visibility.'}
                                                        {info.label.includes('Standard') && 'Longer visibility, better placement.'}
                                                        {info.label.includes('Basic') && 'Standard placement.'}
                                                    </div>
                                                </div>
                                                {!isPlanSelectable && (
                                                    <div className="mt-2 text-xs text-red-600 font-medium">
                                                        Upgrade required to select this plan.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })} */}

                                    {/* <div className="w-full min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 p-8"> */}
                                    <div className="w-full mx-auto">
                                        <div className="grid grid-cols-3 gap-8 items-start">
                                            {listingTiers.map((tier) => {
                                                const isSelected = selectedTier === tier._id;
                                                console.log(isSelected, selectedTier)
                                                const currentDuration = selectedDuration?.days;
                                                const currentPrice = tier.durations.find(d => d.days === currentDuration)?.price || tier.durations[0].price;

                                                return (
                                                    <div key={tier._id} className="flex flex-col h-full">
                                                        <Card
                                                            onClick={() => handleSelectTier(tier)}
                                                            className={`p-0 overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer flex flex-col h-full ${isSelected ? 'border border-primary scale-105 border-3' : 'shadow-lg'
                                                                }`}
                                                        >
                                                            {/* Header */}
                                                            <div
                                                                className={`min-h-[10rem] bg-gradient-to-r ${tier.color} text-white px-6 py-4 flex flex-col gap-2 rounded-t-lg`}
                                                            >
                                                                <h3 className="text-3xl font-bold">
                                                                    {tier.displayName.en}
                                                                </h3>

                                                                {/* <p className="font-bold pt-2">
                                                                    {tier.title.text}
                                                                </p> */}

                                                                <p className="text-sm opacity-90 pt-2">
                                                                    {tier.description}
                                                                </p>
                                                            </div>


                                                            <CardContent className="p-6 bg-white flex flex-col flex-grow">
                                                                {/* Price Card */}
                                                                {/* <div className="bg-white rounded-xl p-5 mb-5 shadow-md border-2 border-gray-100">
                                                                    <div className="flex items-center justify-center mb-2">
                                                                        <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center">
                                                                            <div className="w-20 h-12 bg-white rounded shadow-sm"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 mb-1 text-center">Căn hộ</div>
                                                                    <div className="text-2xl font-bold text-red-500 text-center">
                                                                        {formatPrice(currentPrice)}
                                                                    </div>
                                                                </div> */}

                                                                {/* Description */}
                                                                <p className="text-md font-bold text-orange-500 mb-4">Features</p>

                                                                {/* Features List */}
                                                                <div className="space-y-2.5 mb-6 flex-grow">
                                                                    {tier.highlights.map((highlight, idx) => (
                                                                        <div key={idx} className="flex items-start gap-2.5">
                                                                            {highlight.enabled ? (
                                                                                <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={2} />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-3.5 h-3.5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                                    <X className="w-2.5 h-2.5 text-white" strokeWidth={2} />
                                                                                </div>
                                                                            )}
                                                                            <span
                                                                                className={`text-sm leading-snug ${highlight.enabled ? 'text-gray-800' : 'text-gray-400'
                                                                                    } ${highlight.color === 'orange' ? 'text-orange-600 font-medium' : ''}`}
                                                                            >
                                                                                {highlight.text}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Action Button - Only for middle tier */}
                                                                {/* {tier.tierName === 'boosted' && (
                                                                        <Button
                                                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-base py-6 shadow-lg"
                                                                            onClick={() => handleSelectTier(tier)}
                                                                        >
                                                                            ĐĂNG CHỌN
                                                                        </Button>
                                                                    )} */}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Timeline Section */}
                                        {(() => {
                                            const tierSelected = listingTiers.find(
                                                (t) => t._id === selectedTier
                                            )


                                            return (
                                                <div className="mt-8">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h3 className="font-bold text-gray-800">Display duration</h3>
                                                        <Button onClick={() => { setDurationDialog((v) => !v) }} variant="outline" size="sm" className="font-semibold">Replace</Button>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-lg border-2 border-red-200">
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-red-600 leading-none">{selectedDuration.days}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900">{tierSelected?.displayName?.en}</span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-600">{selectedDuration.days} days</span>
                                                        </div>
                                                        <div className="ml-auto text-lg font-bold text-gray-900">
                                                            {formatPrice(selectedDuration.price)} đ
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                    {/* </div> */}
                                </CardContent>
                            </Card>

                            {/* <Card className="mb-8">
                                <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-sm text-muted-foreground">
                                        Current membership: **{membershipLevel}** • Selected listing plan: **{selectedPlan}** • Purpose: **{purposeValue}**
                                    </div>
                                    <div className="text-2xl font-semibold">Total Fee: {currency(listingFee)}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Phí niêm yết được tính dựa trên **giá trị tài sản** và **gói niêm yết** đã chọn.
                                    </div>
                                </CardContent>
                            </Card> */}

                            <div className="flex items-center justify-between">
                                <Button variant="outline" type="button" onClick={() => setStep(2)}>Back</Button>
                                <Button
                                    type="button"
                                    disabled={form.formState.isSubmitting || planOrder[selectedPlan] > planOrder[membershipLevel]}
                                    onClick={() => {
                                        console.log('[Publish] Attempting submit');
                                        form.handleSubmit(onSubmit, (errors) => {
                                            console.log('[Publish] Validation errors:', errors);
                                            toast.error('Validation failed. Please review required fields.');
                                            // Optionally jump back to step 1 if address invalid:
                                            if (errors?.['address.province'] || errors?.['address.district'] || errors?.['address.ward']) setStep(1);
                                        })();
                                    }}
                                >
                                    {form.formState.isSubmitting ? "Publishing..." : "Publish listing"}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </Form>

            <Dialog open={durationDialog} onOpenChange={setDurationDialog}>
                <DialogContent className="max-w-md rounded-2xl p-0">
                    {/* Header */}
                    <DialogHeader className="relative border-b px-6 py-4">
                        <DialogTitle className="text-center text-lg font-semibold">
                            Select display duration
                        </DialogTitle>
                    </DialogHeader>

                    {/* Body */}
                    <div className="space-y-4 p-6">
                        {(() => {
                            const tierSelected = listingTiers?.find(
                                (t) => t._id === selectedTier
                            )

                            return tierSelected?.durations?.map((d) => (

                                <div
                                    onClick={() => {
                                        setSelectedDuration(d)
                                        setDurationDialog(false)
                                    }}
                                    className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition
                                        ${d.days === selectedDuration.days ? "border-primary border-2" : "border-gray-200"}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon calendar */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                            <span className="font-bold text-gray-700">{d.days}</span>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {tierSelected.displayName.en} <span className="text-gray-500 font-normal">| {d.days} days</span>
                                            </p>
                                        </div>
                                    </div>

                                    <p className="font-semibold text-gray-900">{formatPrice(d.price)} ₫</p>
                                </div>
                            ))
                        })()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 🚨 DIALOG XỬ LÝ LỖI THANH TOÁN (HTTP 402) */}
            <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payment Required</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                        <p className="text-red-600 font-medium">{serverMsg}</p>
                        <p>Required fee: <strong>{currency(requiredFee)}</strong></p>
                        <p>Your current balance: <strong>{currency(currentBalance)}</strong></p>
                        <p className="text-muted-foreground">
                            You must top up your balance or select a lower listing plan to continue.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Tự động chọn plan thấp nhất có thể (chỉ chọn Basic)
                                setSelectedPlan('basic');
                                setDepositDialogOpen(false);
                                toast.info("Switched to Basic plan. Review the new fee and try publishing again.");
                            }}
                        >
                            Choose Basic plan
                        </Button>
                        <Button
                            onClick={() => {
                                setDepositDialogOpen(false);
                                toast.warn(`Redirecting to Deposit...`);
                                navigate("/dashboard/deposit"); // Giả định có route này
                            }}
                        >
                            Deposit now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ContentLayout>
    );
}