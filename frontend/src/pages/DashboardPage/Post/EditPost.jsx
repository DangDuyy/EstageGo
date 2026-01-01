/* eslint-disable no-unused-vars */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Archive, Eye, EyeOff, Save, Trash2, Building2, Car, CookingPot, ShieldCheck, Sofa, Sparkles, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { MapsContext } from "@/components/common/GoogleMap/MapProvider"
import { cn } from '@/lib/utils'

import TourLinkModal from "@/components/common/Upload/tour-link-modal"

import { 
    updatePropertyAPI, 
    updatePropertyStatusAPI, 
    updatePropertyVisibilityAPI,
    getAllProvinces,
    getProvince
} from '@/apis'
import { propertySchema } from "@/schemas/property.schema"
import { API_ROOT } from '@/utils/constants'
import { deletePropertyAPI } from '@/apis/adminAPI'

// Import map components
import CustomSearchBox from "@/components/common/GoogleMap/SearchBox"
import MapContainer from "@/components/common/GoogleMap/MapContainer"
import MarkerLayer from "@/components/common/GoogleMap/MarkerLayer"

// ----- Mock data -----
const propertyTypes = ["Apartment", "House", "Condo", "Land", "Commercial","Office","Villa","Townhouse","Other"]
const currencies = ['VND', 'USD', 'EUR']
const period = ['month', 'year', 'other']

// amenities
const AMENITIES = {
    safety: {
        label: "Safety & Security",
        items: [
            "CCTV",
            "24/7 Security",
            "Fire alarm system",
            "Smart door lock",
            "Key card / fingerprint access",
        ],
    },

    interior: {
        label: "Interior & Furnishing",
        items: [
            "Basic furnishing",
            "Fully furnished",
            "Bed",
            "Wardrobe",
            "Table & chairs",
            "Curtains",
        ],
    },

    kitchen: {
        label: "Kitchen",
        items: [
            "Electric / gas stove",
            "Range hood",
            "Kitchen cabinets",
            "Microwave",
            "Refrigerator",
        ],
    },

    utilities: {
        label: "Building Amenities",
        items: [
            "Elevator",
            "Swimming pool",
            "Gym",
            "Park",
            "Rooftop",
            "BBQ area",
        ],
    },

    parking: {
        label: "Parking",
        items: [
            "Motorbike parking",
            "Car parking",
            "Basement parking",
        ],
    },
}

const ICONS = {
    safety: <ShieldCheck className="h-5 w-5 text-primary" />,
    interior: <Sofa className="h-5 w-5 text-primary" />,
    kitchen: <CookingPot className="h-5 w-5 text-primary" />,
    utilities: <Building2 className="h-5 w-5 text-primary" />,
    parking: <Car className="h-5 w-5 text-primary" />,
}

// ----- Utils -----
const currency = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })

const normalizeName = (name) => {
    if (!name) return ""
    return name
        .toLowerCase()
        .replace(/thành phố|tỉnh|quận|huyện|phường|xã/g, "")
        .trim()
}

export default function EditPost() {
    const { propertyId } = useParams()
    const navigate = useNavigate()
    const currentUser = useSelector(selectCurrentUser)
    const { loaded } = useContext(MapsContext)

    // ----- State -----
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [property, setProperty] = useState(null)
    const [visibility, setVisibility] = useState("public")
    const [status, setStatus] = useState("active") // active, draft, archived
    
    // Combined media state - stores both existing and new images
    const [allImages, setAllImages] = useState([])
    const [deletedImageIds, setDeletedImageIds] = useState([]) // Track deleted existing images
    const fileInputRef = useRef(null)
    
    const [fullAddress, setFullAddress] = useState("")
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [wards, setWards] = useState([])
    const skipGeocodeRef = useRef(false)

    const [center, setCenter] = useState({ lat: 10.762622, lng: 106.660172 })
    const [results, setResults] = useState([])

    // react-hook-form setup - BỎ validation files cho edit mode
    const propertySchemaForEdit = propertySchema.omit({ files: true })

    const form = useForm({
        defaultValues: {
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
            amenities: [],
        },
        resolver: zodResolver(propertySchemaForEdit),
        mode: 'onBlur',
    })

    // Watch values
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
    ])

    // Load property data
    useEffect(() => {
        const loadProperty = async () => {
            if (!propertyId) return
            
            try {
                setIsLoading(true)
                
                const apiUrl = `${API_ROOT}/v1/properties/${propertyId}`
                
                const response = await fetch(apiUrl)
                
                if (!response.ok) {
                    console.error('Response status:', response.status)
                    const text = await response.text()
                    console.error('Response text:', text)
                    
                    if (response.status === 404) {
                        toast.error('Property not found')
                    } else {
                        toast.error('Failed to load property')
                    }
                    navigate('/dashboard/posts')
                    return
                }
                
                const data = await response.json()
                
                if (!data) {
                    toast.error('Property not found')
                    navigate('/dashboard/posts')
                    return
                }
                
                // Check ownership
                const ownerId = data.owner?._id || data.ownerInfo?._id || data.owner
                
                if (ownerId !== currentUser?._id) {
                    toast.error('You do not have permission to edit this property')
                    navigate('/dashboard/posts')
                    return
                }
                
                setProperty(data)
                setVisibility(data.visibility || 'public')
                setStatus(data.status || 'active')
                
                // Load existing images with type marker
                const existingImages = (data.media || [])
                    .filter(m => m.type === 'image')
                    .map((media, index) => ({
                        id: `existing-${media._id || index}`,
                        url: media.url,
                        type: 'existing',
                        mediaId: media._id
                    }))
                setAllImages(existingImages)
                
                // Populate form
                form.reset({
                    title: data.title || '',
                    description: data.description || '',
                    area: data.area || 0,
                    type: data.type || '',
                    address: {
                        province: data.address?.province || '',
                        district: data.address?.district || '',
                        ward: data.address?.ward || '',
                        street: data.address?.street || '',
                        location: {
                            coordinates: data.address?.location?.coordinates || []
                        }
                    },
                    price: {
                        value: data.price?.value || 0,
                        currency: data.price?.currency || 'VND',
                        period: data.price?.period || 'month'
                    },
                    purpose: data.purpose || 'sale',
                    visibility: data.visibility || 'public',
                    rooms: {
                        bedrooms: data.rooms?.bedrooms || 0,
                        bathrooms: data.rooms?.bathrooms || 0,
                        livingrooms: data.rooms?.livingrooms || 0,
                        kitchens: data.rooms?.kitchens || 0,
                    },
                    files: [],
                    yearBuilt: data.yearBuilt || new Date().getFullYear(),
                    amenities: data.amenities || [],
                })
                
                // Set map center if coordinates exist
                if (data.address?.location?.coordinates?.length === 2) {
                    const [lng, lat] = data.address.location.coordinates
                    setCenter({ lat, lng })
                    setResults([{ 
                        lat, 
                        lng, 
                        address: [data.address.street, data.address.ward, data.address.district, data.address.province]
                            .filter(Boolean)
                            .join(', ')
                    }])
                }
                
            } catch (error) {
                console.error('Error loading property:', error)
                toast.error('Failed to load property')
                navigate('/dashboard/posts')
            } finally {
                setIsLoading(false)
            }
        }
        
        loadProperty()
    }, [propertyId, currentUser?._id, navigate])

    // Update visibility form value
    useEffect(() => {
        form.setValue('visibility', visibility)
    }, [visibility, form])

    // Update price.period when purpose changes
    useEffect(() => {
        if (purposeValue === 'sale') {
            form.setValue('price.period', 'other')
        } else if (purposeValue === 'rent' && form.getValues('price.period') === 'other') {
            form.setValue('price.period', 'month')
        }
    }, [purposeValue, form])

    // Fetch provinces on mount
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await getAllProvinces()
                setProvinces(data || [])
            } catch (error) {
                console.error('Error fetching provinces:', error)
            }
        }
        fetchProvinces()
    }, [])

    // Update districts when province changes
    useEffect(() => {
        if (!province || !provinces.length) {
            setDistricts([])
            setWards([])
            return
        }

        const fetchDistricts = async () => {
            const selectedProvince = provinces.find(
                p => normalizeName(p.name) === normalizeName(province)
            )
            if (!selectedProvince) return

            try {
                const data = await getProvince(selectedProvince.code)
                setDistricts(data?.districts || [])
                
                // Reset district & ward if province changed
                const currentDistrict = form.getValues('address.district')
                const districtExists = data?.districts?.some(
                    d => normalizeName(d.name) === normalizeName(currentDistrict)
                )
                if (!districtExists) {
                    form.setValue('address.district', '')
                    form.setValue('address.ward', '')
                }
            } catch (error) {
                console.error('Error fetching districts:', error)
            }
        }
        fetchDistricts()
    }, [province, provinces, form])

    // Update wards when district changes
    useEffect(() => {
        if (!district || !districts.length) {
            setWards([])
            return
        }

        const selectedDistrict = districts.find(
            d => normalizeName(d.name) === normalizeName(district)
        )
        if (selectedDistrict?.wards) {
            setWards(selectedDistrict.wards)
        }
    }, [district, districts])

    // Google Maps functions
    const getAddressComponent = (components = [], type) =>
        components.find((c) => c.types.includes(type))?.long_name || ""

    const populateAddressFromComponents = useCallback((components = [], fallbackStreet = "") => {
        const adminArea1 = getAddressComponent(components, "administrative_area_level_1")
        const adminArea2 = getAddressComponent(components, "administrative_area_level_2")
        const adminArea3 = getAddressComponent(components, "administrative_area_level_3")
        const route = getAddressComponent(components, "route")
        const streetNumber = getAddressComponent(components, "street_number")

        let matchedProvince = ""
        if (adminArea1) {
            const found = provinces.find(p => normalizeName(p.name).includes(normalizeName(adminArea1)))
            if (found) matchedProvince = found.name
        }

        let constructedStreet = fallbackStreet
        if (!constructedStreet) {
            const parts = []
            if (streetNumber) parts.push(streetNumber)
            if (route) parts.push(route)
            constructedStreet = parts.join(", ")
        }

        skipGeocodeRef.current = true
        form.setValue("address.province", matchedProvince || adminArea1 || "", { shouldValidate: true })
        form.setValue("address.district", adminArea2 || "", { shouldValidate: true })
        form.setValue("address.ward", adminArea3 || "", { shouldValidate: true })
        form.setValue("address.street", constructedStreet || "", { shouldValidate: true })
        
        setTimeout(() => { skipGeocodeRef.current = false }, 500)
    }, [form, provinces])

    const handleGeocodeSuccess = useCallback(
        (results, { updateFullAddress = false } = {}) => {
            if (!results || !results.length) return

            const firstResult = results[0]
            const loc = firstResult.geometry?.location
            if (loc) {
                const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat
                const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng

                setCenter({ lat, lng })
                setResults([{ lat, lng, address: firstResult.formatted_address }])

                form.setValue("address.location.coordinates", [lng, lat], { shouldValidate: true })

                if (updateFullAddress) {
                    setFullAddress(firstResult.formatted_address || "")
                }

                populateAddressFromComponents(firstResult.address_components || [])
            }
        },
        [form, populateAddressFromComponents]
    )

    const reverseGeocodeCoordinates = useCallback(
        (lat, lng) => {
            if (!loaded || !window.google?.maps) return
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK") {
                    handleGeocodeSuccess(results, { updateFullAddress: true })
                }
            })
        },
        [loaded, handleGeocodeSuccess]
    )

    const handlePlaceSelected = (place) => {
        if (!place?.geometry?.location) return
        const loc = place.geometry.location
        const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat
        const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng

        setCenter({ lat, lng })
        setResults([{ lat, lng, address: place.formatted_address || "" }])
        setFullAddress(place.formatted_address || "")

        form.setValue("address.location.coordinates", [lng, lat], { shouldValidate: true })

        const route = getAddressComponent(place.address_components || [], "route")
        const streetNumber = getAddressComponent(place.address_components || [], "street_number")
        let streetVal = ""
        if (streetNumber || route) {
            const parts = []
            if (streetNumber) parts.push(streetNumber)
            if (route) parts.push(route)
            streetVal = parts.join(", ")
        }
        populateAddressFromComponents(place.address_components || [], streetVal)
    }

    const handleMapClick = (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        reverseGeocodeCoordinates(lat, lng)
    }

    const handleMarkerClick = (marker) => {
    }

    const handleSearch = () => {
        if (!loaded || !window.google?.maps) return
        const parts = [street, ward, district, province].filter(Boolean)
        if (!parts.length) return
        const query = parts.join(", ")

        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address: query }, (results, status) => {
            if (status === "OK") {
                handleGeocodeSuccess(results)
            }
        })
    }

    useEffect(() => {
        if (!fullAddress || !loaded || skipGeocodeRef.current) return
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === "OK") {
                handleGeocodeSuccess(results)
            }
        })
    }, [fullAddress, loaded, handleGeocodeSuccess])

    // Image handling functions
    const handleAddImages = () => {
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages = Array.from(e.target.files).map(file => ({
                id: `new-${Date.now()}-${Math.random()}`,
                url: URL.createObjectURL(file),
                type: 'new',
                file: file
            }))
            setAllImages(prev => [...prev, ...newImages])
            
            // Update form files
            const newFiles = newImages.map(img => img.file)
            const currentFiles = form.getValues('files') || []
            form.setValue('files', [...currentFiles, ...newFiles])
        }
    }

    const handleRemoveImage = (imageId, imageType) => {
        setAllImages(prev => prev.filter(img => img.id !== imageId))
        
        if (imageType === 'existing') {
            // Track deleted existing image
            const image = allImages.find(img => img.id === imageId)
            if (image?.mediaId) {
                setDeletedImageIds(prev => [...prev, image.mediaId])
            }
        } else {
            // Remove from form files
            const imageToRemove = allImages.find(img => img.id === imageId)
            if (imageToRemove?.file) {
                const currentFiles = form.getValues('files') || []
                form.setValue('files', currentFiles.filter(f => f !== imageToRemove.file))
            }
        }
    }

    // Actions
    const handleSaveDraft = async () => {
        try {
            await updatePropertyStatusAPI(propertyId, 'draft')
            setStatus('draft')
            toast.success('Saved as draft')
        } catch (error) {
            console.error('Error saving draft:', error)
            toast.error('Failed to save draft')
        }
    }

    const handleToggleVisibility = async () => {
        const newVisibility = visibility === 'public' ? 'private' : 'public'
        
        try {
            await updatePropertyVisibilityAPI(propertyId, newVisibility)
            setVisibility(newVisibility)
            toast.success(`Property is now ${newVisibility}`)
        } catch (error) {
            console.error('Error updating visibility:', error)
            toast.error('Failed to update visibility')
        }
    }

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to archive this property?')) return
        
        try {
            await updatePropertyStatusAPI(propertyId, 'archived')
            toast.success('Property archived')
            navigate('/dashboard/posts')
        } catch (error) {
            console.error('Error archiving property:', error)
            toast.error('Failed to archive property')
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
        
        try {
            await deletePropertyAPI(propertyId)
            navigate('/dashboard/posts')
        } catch (error) {
            console.error('Error deleting property:', error)
            toast.error('Failed to delete property')
        }
    }

    const onSubmit = async (data) => {
        if (isSubmitting) return
        
        try {
            setIsSubmitting(true)
            
            // Create FormData for multipart/form-data
            const formData = new FormData()
            
            // Add basic fields
            formData.append('title', data.title)
            formData.append('description', data.description)
            formData.append('area', data.area)
            formData.append('type', data.type)
            formData.append('purpose', data.purpose)
            formData.append('visibility', visibility)
            formData.append('yearBuilt', data.yearBuilt)
            formData.append('status', status)
            
            // Add address as JSON string
            formData.append('address', JSON.stringify(data.address))
            
            // Add price as JSON string
            formData.append('price', JSON.stringify(data.price))
            
            // Add rooms as JSON string
            formData.append('rooms', JSON.stringify(data.rooms))
            
            // Add amenities as JSON string
            formData.append('amenities', JSON.stringify(data.amenities || []))
            
            // Add deleted image IDs as JSON string
            if (deletedImageIds.length > 0) {
                formData.append('deletedImages', JSON.stringify(deletedImageIds))
            }
            
            // Add new image files
            const newFiles = form.getValues('files') || []
            if (newFiles.length > 0) {
                newFiles.forEach((file) => {
                    formData.append('files', file)
                })
            }
                        
            await updatePropertyAPI(propertyId, formData)
            navigate('/dashboard/posts')
        } catch (error) {
            console.error('Error updating property:', error)
            console.error('Error details:', error.response?.data)
            toast.error(error.response?.data?.message || 'Failed to update property')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <ContentLayout title="Edit Property">
                <div className="flex items-center justify-center min-h-screen">
                    <p>Loading...</p>
                </div>
            </ContentLayout>
        )
    }

    return (
        <ContentLayout title="Edit Property">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Status & Actions Bar */}
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Status & Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-3">
                            <span className="flex flex-row gap-3 items-center">
                                {/* Status Toggle */}
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm">Status</Label>
                                    <div className="rounded-full border p-1">
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={status === "active" ? "default" : "ghost"}
                                                onClick={() => setStatus("active")}
                                                className="rounded-full"
                                            >
                                                Active
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={status === "draft" ? "default" : "ghost"}
                                                onClick={() => setStatus("draft")}
                                                className="rounded-full"
                                            >
                                                Draft
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator orientation="vertical" className="h-6" />

                                {/* Visibility Toggle */}
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
                            </span>

                            <div className="ml-auto flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleToggleVisibility}>
                                    {visibility === 'public' ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                    {visibility === 'public' ? 'Hide' : 'Show'}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleArchive}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                </Button>
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Upload */}
                    <Tabs defaultValue='photos' className="mb-8">
                        <TabsList>
                            <TabsTrigger value='photos'>Photos</TabsTrigger>
                            <TabsTrigger value='3D'>3D Tour</TabsTrigger>
                        </TabsList>
                        <TabsContent value="photos">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Property Photos</CardTitle>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddImages}
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Photos
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                    
                                    {allImages.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {allImages.map((image) => (
                                                <div key={image.id} className="relative group">
                                                    <div className="relative h-32 bg-muted rounded-lg overflow-hidden border-2 border-border">
                                                        <img
                                                            src={image.url}
                                                            alt="Property"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {/* Overlay with delete button */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-2 right-2 h-8 w-8"
                                                                onClick={() => handleRemoveImage(image.id, image.type)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        {/* Badge for existing images */}
                                                        {image.type === 'existing' && (
                                                            <div className="absolute bottom-2 left-2">
                                                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                                    Existing
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                            <p className="text-muted-foreground mb-4">No photos yet</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleAddImages}
                                                className="gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Photos
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="3D">
                            <TourLinkModal form={form} />
                        </TabsContent>
                    </Tabs>

                    {/* Address */}
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="address.province"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Province/City</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.province ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select province" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.district"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">District</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange} disabled={!districts.length}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.district ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select district" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {districts.map((d) => (
                                                        <SelectItem key={d.code} value={d.name}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address.ward"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Ward</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange} disabled={!wards.length}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.ward ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select ward" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {wards.map((w) => (
                                                        <SelectItem key={w.code} value={w.name}>{w.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />
                            </div>

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

                            <div className="grid gap-2">
                                <Label>Coordinates Address</Label>
                                <Input placeholder="Location derived from map coordinates" disabled value={fullAddress} />
                            </div>

                            <div>
                                <MapContainer style={{ height: "350px", width: "100%", cursor: "default" }} center={center} zoom={13} onClick={handleMapClick}>
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
                                <FormField
                                    control={form.control}
                                    name='purpose'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Purpose</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.purpose ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select purpose" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem key={'sale'} value='sale'>Sale</SelectItem>
                                                    <SelectItem key={'rent'} value='rent'>Rent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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

                                <FormField
                                    control={form.control}
                                    name="price.currency"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Currency</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {currencies.map((c) => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />

                                {purposeValue === "rent" && (
                                    <FormField
                                        control={form.control}
                                        name="price.period"
                                        render={({ field }) => (
                                            <FormItem className='relative pb-6'>
                                                <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Period</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn("w-full", form.formState.errors.price?.period ? "border-red-500 focus:ring-red-500" : '')}>
                                                            <SelectValue placeholder="Select period" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {period.filter(p => p !== 'other').map((p) => (
                                                            <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className='absolute bottom-0' />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amenities */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg">Amenities</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(AMENITIES).map(([key, group]) => (
                                <div key={key} className="space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        {ICONS[key]}
                                        {group.label}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="amenities"
                                        render={({ field }) => (
                                            <div className="space-y-2">
                                                {group.items.map((item) => (
                                                    <FormItem
                                                        key={item}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), item])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== item
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            {item}
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}

                                                {/* Custom amenity input */}
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes('other')}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), 'other'])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== 'other'
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Khác (vui lòng ghi rõ)
                                                    </FormLabel>

                                                    {field.value?.includes('other') && (
                                                        <Input
                                                            placeholder="Nhập tiện ích khác"
                                                            value={field.value.find(v => v !== 'other') || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value
                                                                if (!val) {
                                                                    field.onChange(field.value.filter(v => v !== 'other'))
                                                                } else {
                                                                    field.onChange([...(field.value.filter(v => v !== 'other')), val])
                                                                  }
                                                            }}
                                                            className="ml-4 flex-1"
                                                        />
                                                    )}
                                                </FormItem>
                                            </div>
                                        )}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
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
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Property Type</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.type ? "border-red-500 focus:ring-red-500" : '')}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {propertyTypes.map((t) => (
                                                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Information (Title & Description) */}
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center">
                                <p className="text-sm font-medium">Quickly create titles and descriptions with AI</p>
                                <Button
                                    variant="outline"
                                    type='button'
                                    className="
                                        ml-auto
                                        w-fit
                                        rounded-full
                                        border-black
                                        px-6 py-5
                                        text-base font-medium
                                        flex items-center gap-2
                                        hover:bg-black/5
                                      "
                                >
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                    Regenerate with AI
                                </Button>
                            </div>
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name='title'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="3-bedroom townhouse with garden" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='description'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Write your description..." className="h-30" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="outline" type="button" onClick={() => navigate('/dashboard/posts')}>
                            Cancel
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="outline" type="button" onClick={handleSaveDraft} disabled={isSubmitting}>
                                Save as Draft
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Property'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </ContentLayout>
    )
}