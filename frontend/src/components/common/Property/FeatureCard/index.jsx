import { useState } from "react";
import { Link } from "react-router-dom"; 
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";

const categories = ["View All", "Apartment", "Villa", "Studio", "House", "Office"];

const properties = [
  { id: 1, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-1.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/1" },
  { id: 2, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-2.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/2" },
  { id: 3, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-3.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/3" },
  { id: 4, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-4.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/4" },
  { id: 5, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-5.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/5" },
  { id: 6, title: "Casa Lomas de Machalí Machas", image: "/images/home/house-6.jpg", location: "145 Brooklyn Ave, California, New York", tags: ["Featured","For Sale"], beds: 1, baths: 2, sqft: 2200, price: 211000, agent: { name: "Duy", avatar: "https://github.com/shadcn.png" }, href: "/properties/6" },
];

export function FeatureCard() {
  const [active, setActive] = useState("View All");

  return (
    <section className="py-32">
      <div className="w-full">
        <div className="mx-auto flex max-w-8xl flex-col items-center gap-6 text-center">
          <p className="mb-6 text-3xl font-semibold">Featured Properties</p>
          <h1 className="mb-6 text-6xl font-semibold">Recommended For You</h1>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all
                  ${active === cat ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid cards */}
          <div className="mx-auto mt-10 grid max-w-[3000px] lg:px-20 grid-cols-1 place-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} item={p} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="my-10 flex items-center justify-center">
          <Button className="flex items-center justify-center rounded-full border border-gray-400 px-7 py-7 text-2xl">
            <Link to="/properties" className="flex flex-row items-center gap-3">
              <span>View all properties</span>
              <ArrowUpRight className="!h-8 !w-8" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
