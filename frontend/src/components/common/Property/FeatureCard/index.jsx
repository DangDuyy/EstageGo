import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { searchPropertiesAPI } from "@/apis";
import { RecommendationCard } from "./RecommendationCard";

const categories = ["View All", "Apartment", "Villa", "Studio", "House", "Office"];

const typeMapping = {
  "View All": null,
  "Apartment": "apartment",
  "Villa": "villa",
  "Studio": "apartment", // Studio có thể map về apartment
  "House": "house",
  "Office": "office"
};

export function FeatureCard() {
  const [active, setActive] = useState("View All");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const filters = {
          page: 1,
          itemsPerPage: 6,
          sortBy: 'featured', // Ưu tiên VIP posts
          status: 'active'
        };

        // Nếu có filter theo type
        const selectedType = typeMapping[active];
        if (selectedType) {
          filters.types = [selectedType];
        }

        const response = await searchPropertiesAPI(filters);
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [active]);

  return (
    <>
      <section className="py-32">
        <div className="w-full">
          <div className="mx-auto flex max-w-8xl flex-col items-center gap-6 text-center">
            <p className="text-3xl font-semibold lg:mb-0 lg:text-2xl">Featured Properties</p>
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
          <div className="mx-auto mt-10 grid max-w-[1350px] gap-y-5 lg:px-20 grid-cols-1 place-items-center space-x-0 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Không có bất động sản nào</p>
              </div>
            ) : (
              properties.map((p) => (
                <div
                  key={p._id || p.id}
                  className="w-full lg:w-[90%] max-w-[2000px]"
                >
                  <PropertyCard item={p} />
                </div>
              ))
            )}
          </div>

          </div>

          {/* CTA */}
          <div className="my-10 flex items-center justify-center">
            <Button className="flex items-center justify-center rounded-full border border-gray-400 px-7 py-7 text-2xl">
              <Link to="/listing/grid" className="flex flex-row items-center gap-3">
                <span>View all properties</span>
                <ArrowUpRight className="!h-8 !w-8" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <RecommendationCard/>
    </>
  );
}
