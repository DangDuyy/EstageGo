/* eslint-disable no-unused-vars */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Archive, Eye, EyeOff, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { MapsContext } from "@/components/common/GoogleMap/MapProvider"
import { cn } from '@/lib/utils'

import ImageUploadComponent from "@/components/common/Upload/uploadImage"
import CustomSearchBox from "@/components/common/GoogleMap/SearchBox"
import MapContainer from "@/components/common/GoogleMap/MapContainer"
import MarkerLayer from "@/components/common/GoogleMap/MarkerLayer"
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

// ----- Mock data -----
const propertyTypes = ["Apartment", "Villa", "Studio", "Office", "Townhouse"]
const currencies = ['VND', 'USD', 'EUR']
const period = ['month', 'year', 'other']

// ----- Utils -----
const currency = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })

const normalizeName = (name) => {
    if (!name) return name
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
    const [property, setProperty] = useState(null)
    const [visibility, setVisibility] = useState("public")
    const [status, setStatus] = useState("active") // active, draft, archived
    const [existingMedia, setExistingMedia] = useState([]) // Lưu ảnh đã có
    
    const [fullAddress, setFullAddress] = useState("")
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [wards, setWards] = useState([])
    const skipGeocodeRef = useRef(false)

    const [center, setCenter] = useState({ lat: 10.762622, lng: 106.660172 })
    const [results, setResults] = useState([])

    // react-hook-form setup
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
        },
        resolver: zodResolver(propertySchema),
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
                
                // Debug: Log propertyId và URL
                console.log('Loading property ID:', propertyId)
                const apiUrl = `${API_ROOT}/v1/properties/${propertyId}`
                console.log('API URL:', apiUrl)
                
                const response = await fetch(apiUrl)
                
                // Kiểm tra response status trước khi parse JSON
                if (!response.ok) {
                    console.error('Response status:', response.status)
                    const text = await response.text()
                    console.error('Response text:', text)
                    
                    if (response.status === 404) {
                        toast.error('Property not found')
                    } else {
                        toast.error(`Error: ${response.status}`)
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
                console.log('Owner ID:', ownerId, 'Current User ID:', currentUser?._id)
                
                if (ownerId !== currentUser?._id) {
                    toast.error('You do not have permission to edit this property')
                    navigate('/dashboard/posts')
                    return
                }
                
                setProperty(data)
                setVisibility(data.visibility || 'public')
                setStatus(data.status || 'active')
                setExistingMedia(data.media || []) // Lưu media URLs
                
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
                    files: [], // Không load media URLs vào files field vì nó expect File objects
                    yearBuilt: data.yearBuilt || new Date().getFullYear(),
                })
                
                // Set map center if coordinates exist
                if (data.address?.location?.coordinates?.length === 2) {
                    setCenter({
                        lng: data.address.location.coordinates[0],
                        lat: data.address.location.coordinates[1]
                    })
                    setResults([{
                        lat: data.address.location.coordinates[1],
                        lng: data.address.location.coordinates[0],
                        address: data.address?.fullAddress || ''
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
    }, [propertyId, currentUser, navigate, form])

    // Update visibility form value
    useEffect(() => {
        form.setValue('visibility', visibility)
    }, [visibility, form])

    // Update price.period when purpose changes
    useEffect(() => {
        if (purposeValue === 'rent' && form.getValues('price.period') === 'other') {
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
    }, [district, districts, form])

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
        console.log("Marker clicked:", marker)
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
            // toast.success đã được gọi trong deletePropertyAPI
            navigate('/dashboard/posts')
        } catch (error) {
            console.error('Error deleting property:', error)
            toast.error('Failed to delete property')
        }
    }

    const onSubmit = async (data) => {
        try {
            // Chuẩn bị data để gửi (loại bỏ files nếu không có file mới)
            const updateData = {
                title: data.title,
                description: data.description,
                area: data.area,
                type: data.type,
                address: data.address,
                price: data.price,
                purpose: data.purpose,
                visibility: visibility,
                rooms: data.rooms,
                yearBuilt: data.yearBuilt,
                status: status
            }
            
            await updatePropertyAPI(propertyId, updateData)
            // toast.success đã được gọi trong updatePropertyAPI
            navigate('/dashboard/posts')
        } catch (error) {
            console.error('Error updating property:', error)
            toast.error('Failed to update property')
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

                                <Separator orientation="vertical" className="h-6" />

                                {/* Status Badge */}
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                    status === 'active' ? "bg-green-100 text-green-700" :
                                    status === 'draft' ? "bg-amber-100 text-amber-700" :
                                    "bg-gray-100 text-gray-700"
                                )}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </span>

                            <div className="ml-auto flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Draft
                                </Button>
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
                            {/* Hiển thị ảnh đã có */}
                            {existingMedia.length > 0 && (
                                <div className="mb-6">
                                    <Label className="mb-3 block">Existing Photos</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {existingMedia.filter(m => m.type === 'image').map((media, index) => (
                                            <div key={index} className="relative group">
                                                <div className="relative h-32 bg-muted rounded-lg overflow-hidden border-2 border-border">
                                                    <img
                                                        src={media.url}
                                                        alt={`Property ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs">Existing</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Upload ảnh mới */}
                            <div>
                                <Label className="mb-3 block">Upload New Photos</Label>
                                <Controller
                                    name="files"
                                    control={form.control}
                                    render={({ field }) => (
                                        <ImageUploadComponent
                                            form={form}
                                            files={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="3D">
                            <TourLinkModal form={form} />
                        </TabsContent>
                    </Tabs>

                    {/* Information */}
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
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
                                                <Textarea placeholder="Write your description..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="after:content-['*'] after:text-red-500 after:ml-0.1">Search Location</Label>
                                <CustomSearchBox onPlaceSelected={handlePlaceSelected} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="address.province"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Province/City</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.province ? "border-red-500" : '')}>
                                                        <SelectValue placeholder="Select province" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {provinces.map((p) => (
                                                            <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
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
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange} disabled={!districts.length}>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.district ? "border-red-500" : '')}>
                                                        <SelectValue placeholder="Select district" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {districts.map((d) => (
                                                            <SelectItem key={d.code} value={d.name}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
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
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange} disabled={!wards.length}>
                                                    <SelectTrigger className={cn("w-full", form.formState.errors.address?.ward ? "border-red-500" : '')}>
                                                        <SelectValue placeholder="Select ward" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {wards.map((w) => (
                                                            <SelectItem key={w.code} value={w.name}>{w.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
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
                                <Input placeholder="Location derived from map" disabled value={fullAddress} />
                            </div>

                            <div>
                                <MapContainer center={center} zoom={13} onClick={handleMapClick}>
                                    <MarkerLayer items={results} onMarkerClick={handleMarkerClick} />
                                </MapContainer>
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

                                <FormField
                                    control={form.control}
                                    name="price.currency"
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Currency</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className={cn(
                                                        "w-full",
                                                        form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : ''
                                                    )}>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currencies.map((c) => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
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
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className={cn(
                                                            "w-full",
                                                            form.formState.errors.price?.period ? "border-red-500 focus:ring-red-500" : ''
                                                        )}>
                                                            <SelectValue placeholder="Select period" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {period.filter(p => p !== 'other').map((p) => (
                                                                <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
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
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className={cn(
                                                        "w-full",
                                                        form.formState.errors.type ? "border-red-500 focus:ring-red-500" : ''
                                                    )}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {propertyTypes.map((t) => (
                                                            <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage className='absolute bottom-0' />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='purpose'
                                    render={({ field }) => (
                                        <FormItem className='relative pb-6'>
                                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Purpose</FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange}>
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="outline" type="button" onClick={() => navigate('/dashboard/posts')}>
                            Cancel
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="outline" type="button" onClick={handleSaveDraft}>
                                Save as Draft
                            </Button>
                            <Button type="submit">
                                Update Property
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </ContentLayout>
    )
}