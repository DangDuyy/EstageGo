import { getPersonalizedRecommendationsAPI } from "@/apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";

export function RecommendationCard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const pageSize = 6;

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const result = await getPersonalizedRecommendationsAPI(30);
        const recommended = result?.data || result?.properties || result?.recommendations || [];
        setProperties(Array.isArray(recommended) ? recommended : []);
        setPage(0);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
        setPage(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const totalPages = Math.max(1, Math.ceil(properties.length / pageSize));
  const visibleProperties = properties.slice(page * pageSize, page * pageSize + pageSize);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <section className="py-32">
      <div className="w-full">
        <div className="mx-auto flex max-w-8xl flex-col items-center gap-6 text-center">
          <p className="text-3xl font-semibold lg:mb-0 lg:text-xxl">Recommended For You</p>

          {/* Grid cards */}
        <div className="mx-auto mt-10 max-w-[1350px] lg:px-20 relative">
          <div className="grid gap-y-5 grid-cols-1 place-items-center space-x-0 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Chưa tìm được bất động sản phù hợp với bạn</p>
              </div>
            ) : (
              visibleProperties.map((p) => (
                <div
                  key={p._id || p.id}
                  className="relative w-full lg:w-[90%] max-w-[2000px]"
                >
                  {p.predictionScore !== undefined && (
                    <Badge
                      variant="secondary"
                      className="absolute right-2 top-2 z-10 bg-black/70 text-white"
                    >
                      Score: {p.predictionScore?.toFixed(2)}
                    </Badge>
                  )}
                  <PropertyCard item={p} />
                </div>
              ))
            )}
          </div>

          {!loading && properties.length > pageSize && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-6 top-1/2 -translate-y-1/2 shadow-md z-20"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={!canPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-6 top-1/2 -translate-y-1/2 shadow-md z-20"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={!canNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
