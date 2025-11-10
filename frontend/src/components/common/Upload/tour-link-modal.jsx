import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const PROVIDERS = [
    ["3DPlans", "Asteroom", "AtHum", "Beyond View", "Biganto", "CloudPano", "CubiCasa", "Cupix", "EyeSpy360", "Get360s", "Giraffe360"],
    ["Go Prop Tech", "Google Maps 360", "Gryd", "Helix Media", "iGuide", "InsideMaps", "Inspection Express", "IT49", "KNTXT", "Kuula", "Labpano"],
    ["LCP Media", "Listing 3D", "Momento360", "Nodalview", "Panoroom", "Peek", "PlaceVR", "PropertyPanorama", "Real Vision", "RealPage", "Repli 3D"],
    ["Ricoh", "Sphere", "The View", "Tour Factory", "TourMKR", "TrueView360", "VPIX", "White Branch", "Zillow 3D Home", "zInspector"]
];

export default function TourLinkModal({ form, className }) {
    return (
        <Card className={className}>
            <CardHeader><CardTitle>Provide the link to your tour</CardTitle></CardHeader>
            <CardContent className="space-y-6">

                {/* TITLE */}
                <div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add a tour link from one of the supported sources:
                    </p>
                </div>

                {/* LIST PROVIDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {PROVIDERS.map((col, i) => (
                        <ul key={i} className="space-y-1">
                            {col.map((item) => (
                                <li key={item} className="list-disc ml-4">{item}</li>
                            ))}
                        </ul>
                    ))}
                </div>

                {/* FORM FIELDS */}
                <div className="space-y-4">

                    {/* TOUR LINK */}
                    <div className="space-y-2">
                        <FormField
                            control={form.control}
                            name='tour_link'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.1">Tour link</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://app.cloudpano.com/tours/"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                </div>

            </CardContent>
        </Card>
    );
}
