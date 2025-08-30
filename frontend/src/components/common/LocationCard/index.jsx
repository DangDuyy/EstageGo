import * as React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export default function LocationCard() {
  const [api, setApi] = React.useState(null);
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  return (
    <div className="mx-auto min-w-full px-2 flex flex-col">
      <div className="min-w-full flex flex-col gap-5 items-center justify-center py-10 font-semibold">
        <p className="text-xl text-blue-600">EXPLORE CITIES</p>
        <h1 className="text-6xl">Our location for you</h1>
      </div>

      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{ align: "start", loop: true, containScroll: "trimSnaps" }}
      >
        <CarouselContent className="-ml-4">
          {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem
              key={index}
              className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"
            >
            <Card className="p-0 rounded-xl overflow-hidden relative">
              <CardHeader className="p-0">
                <img
                  src={`/images/location/location-${(index % 6) + 1}.jpg`}
                  alt=""
                  className="block w-full h-auto rounded-xl"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 px-4 py-3 rounded-xl shadow-md flex items-center justify-between w-[95%]">
                  <div>
                    <p className="text-xs font-semibold">321 Property</p>
                    <p className="text-base font-medium text-gray-900">Naperville</p>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300">
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Dots indicator */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn("h-3.5 w-3.5 rounded-full border-2", {
              "border-primary": current === index + 1,
            })}
          />
        ))}
      </div>
    </div>
  );
}
