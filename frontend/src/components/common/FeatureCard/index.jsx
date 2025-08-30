import {
  ArrowUpRight,
  BathIcon,
  BedIcon,
  LandPlot,
  MapPin
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const categories = ["View All", "Apartment", "Villa", "Studio", "House", "Office"]

const FeatureCard = () => {
  const [active, setActive] = useState("View All")

  return (
    <section className="py-32">
      <div className="w-full">
        <div className="mx-auto flex max-w-8xl flex-col items-center gap-6 text-center">
          <p className="mb-6 text-3xl font-semibold text-pretty lg:text-3xl">
            Featured Properties
          </p>
          <h1 className="mb-6 text-6xl font-semibold text-pretty lg:text-7xl">
            Recommended For You
          </h1>
          
          <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
                    ${
                      active === cat
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {cat}
                </button>
              ))}
          </div>

          <div className="mt-10 grid grid-cols-1 place-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-[3000px]">
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-1.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-2.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-3.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-4.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-6.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            <Card className="pt-0 pb-2 min-w-[500px] min-h-[500px] rounded-3xl">
              <CardHeader className="p-0 relative">
                <img
                  className="h-80 w-full rounded-tl-md object-cover  rounded-t-3xl object-center"
                  src="/images/home/house-7.jpg"
                  alt="placeholder"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                    Featured
                  </span>
                  <span className="rounded-full bg-gray-700 text-white px-3 py-1 text-sm font-semibold">
                    For Sale
                  </span>
                </div>

                {/* Location */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-xl text-white">
                  <MapPin className="h-5 w-5 text-white" />
                  <p>145 Brooklyn Ave, California, New York</p>
                </div>
              </CardHeader>
              <CardContent className="text-left">
                <h1 className="mb-3 text-xl font-semibold">Casa Lomas de Machalí Machas</h1>
                <div className="leading-snug text-muted-foreground flex gap-4">
                  <div className="gap-2 flex items-center flex-row">
                    <BedIcon className="h-6 w-6" />
                    <span>Bed: 1</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <BathIcon className="h-6 w-6" />
                    <span>Bath: 2</span>
                  </div>
                  <div className="gap-2 flex items-center flex-row">
                    <LandPlot className="h-6 w-6" />
                    <span>Sqrt: 2,200km</span>
                  </div>
                </div>
              </CardContent>
              <Separator className="mx-auto max-w-[400px]" />
              <CardFooter className="justify-between pb-0 py-2 font-semibold text-xl ">
                <div className="flex flex-row gap-5 items-center">
                  <Avatar  className="h-12 w-12">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p>Duy</p>
                </div>
                <p>$211.000</p>
              </CardFooter>
            </Card>
            
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center my-10">
        <Button className="flex justify-center items-center rounded-full border border-gray-400 px-7 py-7 text-2xl cursor-pointer">
          <Link href="/properties" className="flex flex-row gap-3 items-center">
            <span>View all properties</span>
            <ArrowUpRight className="!h-8 !w-8" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export { FeatureCard };

