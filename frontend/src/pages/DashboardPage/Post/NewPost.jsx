import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import ImageUploadComponent from "@/components/common/Upload/uploadImage";
import { createProperty, getAllProvinces, getProvince } from "@/apis";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema } from "@/schemas/property.schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MapComponent from "@/components/common/Map/map-component";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import TourLinkModal from "@/components/common/Upload/tour-link-modal";
import MapContainer from "@/components/common/GoogleMap/MapContainer";

// ----- Mock data -----
const propertyTypes = ["Apartment", "Villa", "Studio", "Office", "Townhouse"];
const brokers = [
  { id: "b1", name: "Alice Nguyen", phone: "+84 912 345 678", email: "alice@broker.com" },
  { id: "b2", name: "John Tran", phone: "+84 933 222 111", email: "john@broker.com" },
];
const currencies = ['VND', 'USD', 'EUR']
const period = ['month', 'year', 'other']

// ----- Utils -----
const currency = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Stepper({ step, setStep }) {
  const items = ["Verify & Details", "Agent", "Documents & Payment"];
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
  address: {
    province: '',
    district: '',
    ward: ''
  },
  price: {
    value: 0
  },
  rooms: {
    bedrooms: 0,
    bathrooms: 0,
    livingrooms: 0,
    kitchens: 0,
  }
}

export default function AddPropertyWizard() {
  const navigate = useNavigate();

  // ----- Step control -----
  const [step, setStep] = useState(1);

  // ----- Phone verify (Step 1) -----
  const [phoneModalOpen, setPhoneModalOpen] = useState(true);
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);

  // ----- Listing info (Step 1) -----
  const [listingMode, setListingMode] = useState("sale"); // "sale" | "rent"
  const [visibility, setVisibility] = useState("public")

  const [fullAddress, setFullAddress] = useState("")
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  // ----- Agent (Step 2) -----
  const [agentType, setAgentType] = useState("owner"); // "owner" | "broker"
  const [brokerId, setBrokerId] = useState();
  const selectedBroker = useMemo(
    () => brokers.find((b) => b.id === brokerId),
    [brokerId]
  );

  // ----- Documents + Payment (Step 3) -----
  const [houseDocs, setHouseDocs] = useState([]);
  const [idDocs, setIdDocs] = useState([]);
  const docsValid = houseDocs.length > 0 && idDocs.length > 0;
  // const listingFee = useMemo(() => {
  //   const base = listingMode === "sale" ? 50 : 30;
  //   const perImage = 5 * (images?.length || 0);
  //   return base + perImage;
  // }, [listingMode, images.length]);
  const [paid, setPaid] = useState(false);

  // ----- Effects -----
  useEffect(() => {
    setPhoneModalOpen(!isPhoneVerified);
  }, [isPhoneVerified]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Demo login cần phải xóa
  // useEffect(() => {
  //   const login = async () => {
  //     await loginAPI()
  //   }

  //   login()
  // })

  function handleDocsChange(kind, files) {
    if (!files) return;
    const arr = Array.from(files);
    if (kind === "house") setHouseDocs(arr);
    else setIdDocs(arr);
  }

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

  // function canNextFromStep1() {
  //   return isPhoneVerified && title.trim() && address.trim() && price.trim();
  // }

  // function canPost() {
  //   return canNextFromStep1() && docsValid && paid;
  // }

  function doPay() {
    // TODO: integrate payment gateway
    setPaid(true);
    toast.success("Payment completed.");
  }

  // Config form sử dụng react-hook-form và zod
  const form = useForm({
    defaultValues: propertyDefaultValue,
    resolver: zodResolver(propertySchema),
    mode: 'onSubmit'
  })

  // Theo dõi các biến province, district, ward, street để cập nhật address
  const [province, district, ward, street] = form.watch([
    'address.province',
    'address.district',
    'address.ward',
    'address.street'
  ]);

  // Set fullAddress
  const handleSearch = () => {
    const fullAddr = [
      street?.trim(),
      ward?.trim(),
      district?.trim(),
      province?.trim()
    ]
      .filter(Boolean)        // loại bỏ giá trị rỗng
      .join(', ');            // nối với dấu phẩy

    setFullAddress(fullAddr);
  }

  // ========== Call Provinces ================
  useEffect(() => {
    const fetchProvinces = async () => {
      const response = await getAllProvinces()
      setProvinces(response)
    }

    fetchProvinces()
  }, [])

  useEffect(() => {
    const handleSelectProvince = async (provinceCode) => {
      const response = await getProvince(provinceCode)
      setDistricts(response.districts)
    }

    const provinceCode = provinces.find(p => p.name === province)?.code
    console.log(provinceCode)
    if (!provinceCode) return
    handleSelectProvince(provinceCode)
    form.setValue('address.district', '')
  }, [province, provinces])

  useEffect(() => {
    const districtSelected = districts.find(d => d.name === district)
    if (!districtSelected) return
    setWards(districtSelected.wards)
    form.setValue('address.ward', '')
  }, [district, districts])

  // ========== function onSubmit ==========
  const onSubmit = async (data) => {
    // Tạo FormData
    const formData = new FormData();

    // Append fields khác
    for (const key in data) {
      if (key !== "files") {
        const value = data[key];
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value); // để nguyên string/number
        }
      }
    }

    // Append file
    data.files.forEach(file => {
      formData.append("files", file);
    });

    // Gửi request
    await createProperty(formData);
    toast.success('Post success')
  };

  useEffect(() => {
    form.setValue('visibility', visibility)
  }, [visibility])


  // ============ Sử dụng map =======================
  const { loaded } = useMaps();
  const [center, setCenter] = useState({ lat: 10.762622, lng: 106.660172 });
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!fullAddress || !window.google || !loaded) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      // if (status === "OK" && results[0]) {
      //   const location = results[0].geometry.location;
      //   // trả về lat và lng
      //   onResult?.({
      //     lat: location.lat(),
      //     lng: location.lng(),
      //   });
      // } 
      if (status === "OK") {
        setResults[results]
        const loc = p.geometry.location;
        setCenter({ lat: loc.lat(), lng: loc.lng() });
      }
      else {
        console.error("Geocode failed: ", status);
      }
    });
  }, [fullAddress, onResult]);

  // ----- Render -----
  return (
    <ContentLayout title="Add Property">
      {/* Stepper */}
      {/* <Stepper step={step} setStep={setStep} /> */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* STEP 1 */}
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

              <Tabs defaultValue='photos'>
                <TabsList>
                  <TabsTrigger value='photos'>Add Photos</TabsTrigger>
                  <TabsTrigger value='3D'>3D Tour</TabsTrigger>
                </TabsList>
                <TabsContent value="photos">
                  {/* Upload media */}
                  <Controller
                    name="files"
                    control={form.control}
                    render={({ field }) => (
                      <ImageUploadComponent
                        className={"mb-8"}
                        form={form}
                        files={field.value}             // value từ form
                        onChange={field.onChange}  // update value form
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
                      {/* Title */}
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
                      {/* Description */}
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

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      {/* Province */}
                      <FormField
                        control={form.control}
                        name="address.province"
                        render={({ field }) => (
                          <FormItem className='relative pb-6'>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Province/City</FormLabel>
                            <FormControl>
                              <Select                               // Select không dùng được với {...field}
                                value={field.value}                 // Dùng field.value
                                onValueChange={field.onChange}      // Dùng field.onChange
                              >
                                <SelectTrigger className={cn(
                                  "w-full",
                                  form.formState.errors.address?.province ? "border-red-500 focus:ring-red-500" : ''
                                )}>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* {countries.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))} */}
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

                    </div>
                    <div className="grid gap-2">
                      {/* <Label className="after:content-['*'] after:text-red-500 after:ml-0.1">Zip Code</Label>
                      <Input
                        placeholder="700000"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      /> */}

                      {/* District */}
                      <FormField
                        control={form.control}
                        name="address.district"
                        render={({ field }) => (
                          <FormItem className='relative pb-6'>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">District</FormLabel>
                            <FormControl>
                              <Select                               // Select không dùng được với {...field}
                                value={field.value}                 // Dùng field.value
                                onValueChange={field.onChange}      // Dùng field.onChange
                              >
                                <SelectTrigger className={cn(
                                  "w-full",
                                  form.formState.errors.address?.district ? "border-red-500 focus:ring-red-500" : ''
                                )}>
                                  <SelectValue placeholder="Select district" />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* {countries.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))} */}
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
                    </div>
                    <div className="grid gap-2">

                      {/* Ward */}
                      <FormField
                        control={form.control}
                        name="address.ward"
                        render={({ field }) => (
                          <FormItem className='relative pb-6'>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Ward</FormLabel>
                            <FormControl>
                              <Select                               // Select không dùng được với {...field}
                                value={field.value}                 // Dùng field.value
                                onValueChange={field.onChange}      // Dùng field.onChange
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
                        )
                        }
                      />
                    </div>
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
                            onBlur={handleSearch}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-2">
                    <Label>Your Address</Label>
                    <Input
                      placeholder="Notes about location (coordinates, map link, etc.)"
                      disabled
                      value={fullAddress}
                    />
                  </div>

                  <MapContainer center={center} zoom={13}>
                    <MarkerLayer items={results} onMarkerClick={(it) => console.log(it)} />
                  </MapContainer>
                  <div>
                    <MapComponent form={form} address={fullAddress} />
                  </div>
                </CardContent>
              </Card>

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

                    <div></div>

                    {/* Currency */}
                    <FormField
                      control={form.control}
                      name="price.currency"
                      render={({ field }) => (
                        <FormItem className='relative pb-6'>
                          <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Currency</FormLabel>
                          <FormControl>
                            <Select                               // Select không dùng được với {...field}
                              value={field.value}                 // Dùng field.value
                              onValueChange={field.onChange}      // Dùng field.onChange
                            >
                              <SelectTrigger className={cn(
                                "w-full",
                                form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : ''
                              )}>
                                <SelectValue placeholder="Select ward" />
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
                      )
                      }
                    />

                    {/* Period */}
                    <FormField
                      control={form.control}
                      name="price.period"
                      render={({ field }) => (
                        <FormItem className='relative pb-6'>
                          <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Period</FormLabel>
                          <FormControl>
                            <Select                               // Select không dùng được với {...field}
                              value={field.value}                 // Dùng field.value
                              onValueChange={field.onChange}      // Dùng field.onChange
                            >
                              <SelectTrigger className={cn(
                                "w-full",
                                form.formState.errors.price?.period ? "border-red-500 focus:ring-red-500" : ''
                              )}>
                                <SelectValue placeholder="Select ward" />
                              </SelectTrigger>
                              <SelectContent>
                                {period.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {p.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>

                          <FormMessage className='absolute bottom-0' />
                        </FormItem>
                      )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="mb-8">
                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name='area'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Area (SqFt)</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder=""
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                        name='yearBuilt'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Year Built</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder=""
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                        name='rooms.livingrooms'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Living Room</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder=""
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name='rooms.kitchens'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Kitchens</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder="Enter house number, street"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                        name='rooms.bedrooms'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Bedrooms</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder="Enter house number, street"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
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
                        name='rooms.bathrooms'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Bathrooms</FormLabel>
                            <FormControl>
                              <Input
                                type={'number'}
                                placeholder="Enter house number, street"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => {
                          return (
                            <FormItem className='relative pb-6'>
                              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Property Type</FormLabel>
                              <FormControl>
                                <Select                               // Select không dùng được với {...field}
                                  value={field.value}                 // Dùng field.value
                                  onValueChange={field.onChange}      // Dùng field.onChange
                                >
                                  <SelectTrigger className={cn(
                                    "w-full",
                                    form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : ''
                                  )}>
                                    <SelectValue placeholder="Select ward" />
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
                          )
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name='purpose'
                        render={({ field }) => (
                          <FormItem className='relative pb-6'>
                            <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Purpose</FormLabel>
                            <FormControl>
                              <Select                               // Select không dùng được với {...field}
                                value={field.value}                 // Dùng field.value
                                onValueChange={field.onChange}      // Dùng field.onChange
                              >
                                <SelectTrigger className={cn(
                                  "w-full",
                                  form.formState.errors.price?.currency ? "border-red-500 focus:ring-red-500" : ''
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
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div></div>
                <div className="flex gap-3">
                  <Button variant="default" disabled={form.formState.isSubmitting} type="submit">
                    {form.formState.isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  {/* <Button type="button" disabled={!canNextFromStep1()} onClick={() => setStep(2)}>
                    Continue
                  </Button> */}
                </div>
              </div>

              {/* Phone Verification Modal */}
              <Dialog open={phoneModalOpen} onOpenChange={(o) => setPhoneModalOpen(o)}>
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="min-h-screen">
              <Card className="mb-8">
                <CardHeader><CardTitle>Choose Agent</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={agentType}
                    onValueChange={(v) => setAgentType(v)}
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="owner" id="owner" />
                      <Label htmlFor="owner" className="cursor-pointer">I am the owner (no broker)</Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="broker" id="broker" />
                      <Label htmlFor="broker" className="cursor-pointer">Use a broker for this listing</Label>
                    </div>
                  </RadioGroup>

                  {agentType === "broker" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Broker</Label>
                        <Select value={brokerId} onValueChange={setBrokerId}>
                          <SelectTrigger><SelectValue placeholder="Select a broker" /></SelectTrigger>
                          <SelectContent>
                            {brokers.map((b) => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Broker Phone</Label>
                        <Input value={selectedBroker?.phone ?? ""} readOnly placeholder="-" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Broker Email</Label>
                        <Input value={selectedBroker?.email ?? ""} readOnly placeholder="-" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="min-h-screen">
              <Card className="mb-8">
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
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

                  <div className="rounded-lg border border-dashed p-6">
                    <Label htmlFor="id-docs" className="mb-2 block">
                      Your ID card (front/back) (PDF/JPG/PNG)
                    </Label>
                    <Input
                      id="id-docs"
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      onChange={(e) => handleDocsChange("id", e.target.files)}
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
              </Card>

              <Card className="mb-8">
                <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Listing Fee</div>
                    <div className="text-2xl font-semibold">{currency(listingFee)}</div>
                    <div className="text-xs text-muted-foreground">
                      {/* {listingMode === "sale" ? "Base $50" : "Base $30"} + ${5} × {images.length} image(s) */}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant={paid ? "secondary" : "default"}
                      onClick={doPay}
                      disabled={!docsValid || paid}
                      className="min-w-[140px]"
                    >
                      {paid ? "Paid" : "Pay now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                {/* <Button type="button" onClick={onSubmitPost} disabled={!canPost()}>
                  Post
                </Button> */}
              </div>
            </div>
          )}
        </form>
      </Form>
    </ContentLayout>
  );
}
