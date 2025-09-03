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

// ----- Mock data -----
const countries = ["United States", "United Kingdom", "Viet Nam", "Singapore"];
const propertyTypes = ["Apartment", "Villa", "Studio", "Office", "Townhouse"];
const labels = ["New Listing", "Open House"];
const brokers = [
  { id: "b1", name: "Alice Nguyen", phone: "+84 912 345 678", email: "alice@broker.com" },
  { id: "b2", name: "John Tran", phone: "+84 933 222 111", email: "john@broker.com" },
];

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

export default function AddPropertyWizard() {
  const navigate = useNavigate();

  // ----- Step control -----
  const [step, setStep] = useState(1);

  // ----- Phone verify (Step 1) -----
  const [phoneModalOpen, setPhoneModalOpen] = useState(true);
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // ----- Listing info (Step 1) -----
  const [listingMode, setListingMode] = useState("sale"); // "sale" | "rent"
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [stateText, setStateText] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [price, setPrice] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [label, setLabel] = useState("New Listing");
  const [type, setType] = useState("Apartment");
  const [size, setSize] = useState("");
  const [land, setLand] = useState("");
  const [rooms, setRooms] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [year, setYear] = useState("");

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
  const listingFee = useMemo(() => {
    const base = listingMode === "sale" ? 50 : 30;
    const perImage = 5 * (images?.length || 0);
    return base + perImage;
  }, [listingMode, images.length]);
  const [paid, setPaid] = useState(false);

  // ----- Effects -----
  useEffect(() => {
    setPhoneModalOpen(!isPhoneVerified);
  }, [isPhoneVerified]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ----- Handlers -----
  function handleImagesChange(files) {
    if (!files) return;
    setImages(Array.from(files).slice(0, 10));
  }

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

  function canNextFromStep1() {
    return isPhoneVerified && title.trim() && address.trim() && price.trim();
  }

  function canPost() {
    return canNextFromStep1() && docsValid && paid;
  }

  function doPay() {
    // TODO: integrate payment gateway
    setPaid(true);
    toast.success("Payment completed.");
  }

  function onSubmitPost() {
    if (!canPost()) {
      toast.error("Please complete all required steps before posting.");
      return;
    }
    // TODO: integrate create post API (gather all states here)
    toast.success("Post success");
    navigate("/dashboard/posts");
  }

  // ----- Render -----
  return (
    <ContentLayout title="Add Property">
      {/* Stepper */}
      <Stepper step={step} setStep={setStep} />

      {/* STEP 1 */}
      {step === 1 && (
        <div className="min-h-screen">
          <Card className="mb-8">
            <CardHeader><CardTitle>Phone Verification</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Phone verification is required to submit a listing.
            </CardContent>
          </Card>

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
                <Label className="text-sm">Listing mode</Label>
                <div className="rounded-full border p-1">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={listingMode === "sale" ? "default" : "ghost"}
                      onClick={() => setListingMode("sale")}
                      className="rounded-full"
                    >
                      For Sale
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={listingMode === "rent" ? "default" : "ghost"}
                      onClick={() => setListingMode("rent")}
                      className="rounded-full"
                    >
                      For Rent
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload media */}
          <Card className="mb-8">
            <CardHeader><CardTitle>Upload Media</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6">
                <Label htmlFor="images" className="mb-2 block text-sm">Select photos (up to 10)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImagesChange(e.target.files)}
                />
                {images.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {images.length} image(s) selected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="mb-8">
            <CardHeader><CardTitle>Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="3-bedroom townhouse with garden"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Write your description..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Full Address *</Label>
                  <Input
                    placeholder="Enter property full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Zip Code *</Label>
                  <Input
                    placeholder="700000"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Province/State *</Label>
                  <Input
                    placeholder="e.g., Ho Chi Minh"
                    value={stateText}
                    onChange={(e) => setStateText(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Neighborhood *</Label>
                  <Input
                    placeholder="e.g., District 10"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  placeholder="Notes about location (coordinates, map link, etc.)"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price & Attributes */}
          <Card className="mb-8">
            <CardHeader><CardTitle>Price & Attributes</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Price *</Label>
                  <Input
                    placeholder="Example value: 12345"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <Input
                    placeholder="Optional"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Property Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Property Status *</Label>
                  <Input value={listingMode === "sale" ? "For Sale" : "For Rent"} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>Property Label</Label>
                  <Select value={label} onValueChange={setLabel}>
                    <SelectTrigger><SelectValue placeholder="Select label" /></SelectTrigger>
                    <SelectContent>
                      {labels.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Size (SqFt)</Label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Land Area (SqFt)</Label>
                  <Input value={land} onChange={(e) => setLand(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Year Built</Label>
                  <Input value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Rooms</Label>
                  <Input value={rooms} onChange={(e) => setRooms(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Bedrooms</Label>
                  <Input value={beds} onChange={(e) => setBeds(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Bathrooms</Label>
                  <Input value={baths} onChange={(e) => setBaths(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">* Required fields</div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => toast.info("Draft saved (mock).")}>
                Save Draft
              </Button>
              <Button type="button" disabled={!canNextFromStep1()} onClick={() => setStep(2)}>
                Continue
              </Button>
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
                  {listingMode === "sale" ? "Base $50" : "Base $30"} + ${5} × {images.length} image(s)
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
            <Button type="button" onClick={onSubmitPost} disabled={!canPost()}>
              Post
            </Button>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
