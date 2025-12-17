import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecentReviewsAPI } from "@/apis";
import { Skeleton } from "@/components/ui/skeleton";

const ReviewForm = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const result = await getAllRecentReviewsAPI(6);
        setReviews(result.reviews || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-6 h-6 ${
          i < rating
            ? "fill-yellow-500 stroke-yellow-500"
            : "fill-gray-300 stroke-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center px-6">
        <div>
          <h2 className="mb-8 lg:mb-4 text-5xl lg:text-4xl font-bold text-center tracking-tight">
            Our customer's review
          </h2>
          <div className="w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-hidden border-r border-background">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col outline outline-border px-6 py-8">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="w-6 h-6 rounded" />
                    ))}
                  </div>
                  <Skeleton className="my-6 h-20 rounded" />
                  <div className="mt-auto flex items-center justify-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center px-6">
      <div>
        <h2 className="mb-8 lg:mb-4 text-5xl lg:text-4xl font-bold text-center tracking-tight">
          Our customer's review
        </h2>
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-hidden border-r border-background">
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="flex flex-col outline outline-border px-6 py-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    {renderStars(review.rating)}
                  </div>
                  <p className="my-6 text-[17px] text-center max-w-md">
                    &quot;{review.comment || "No comment provided"}&quot;
                  </p>
                  <div className="mt-auto">
                    <p className="text-center text-sm text-gray-600 mb-3">
                      {review.reviewer?.fullName || review.reviewer?.userName} reviewed{" "}
                      <span className="font-semibold">
                        {review.agent?.fullName || review.agent?.userName}
                      </span>
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.reviewer?.avatar} />
                        <AvatarFallback className="text-xl font-medium bg-primary text-primary-foreground">
                          {(review.reviewer?.fullName || review.reviewer?.userName)
                            ?.charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {review.reviewer?.fullName || review.reviewer?.userName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 w-full text-center py-20">
                No reviews available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
