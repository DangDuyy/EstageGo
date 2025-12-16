/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'
import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, Users, Sparkles, Target } from 'lucide-react'
import { getPersonalizedRecommendationsAPI } from '@/apis'
import { selectCurrentUser } from '@/redux/user/userSlice'

export default function SemanticRecommendPage() {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/')
      return
    }

    fetchRecommendations()
  }, [currentUser, navigate])

  /**
   * Fetch personalized recommendations using Collaborative Filtering
   * 
   * Cách hoạt động:
   * 1. Frontend gọi API này khi user truy cập trang recommendations
   * 2. Backend sử dụng tất cả interactions của user (VIEW >10s, CONTACT, WISHLIST_ADD) 
   *    để xây dựng User-Property Preference Matrix
   * 3. Backend tìm users tương tự (Cosine Similarity) dựa trên ma trận này
   * 4. Backend dự đoán properties mà user chưa xem nhưng similar users đã thích
   * 5. Trả về top-K properties được đề xuất
   * 
   * Lưu ý: 
   * - VIEW >10s KHÔNG phải điều kiện để hiển thị recommendations
   * - VIEW >10s chỉ là một trong những dữ liệu để backend tính toán
   * - Recommendations có thể hiển thị ngay cả khi user chưa có nhiều interactions
   *   (backend sẽ fallback về popular properties)
   */
  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const result = await getPersonalizedRecommendationsAPI(12)
      
      if (result.success) {
        const basedOn = result.meta?.basedOn || {}
        const metadata = result.meta || {}
        
        // Check if backend is using Content-Based (has districts, types, etc.) instead of CF
        const isContentBased = !!(basedOn.districts || basedOn.types || basedOn.purposes || basedOn.priceRange)
        const isPopular = basedOn.type === 'popular' || basedOn.type === 'latest'
        
        // Check if it's truly Collaborative Filtering (must have CF metadata)
        const hasCFMetadata = !!(metadata.similarUsersCount || metadata.avgSimilarityScore || metadata.algorithm || metadata.kNeighbors)
        const isCollaborativeFiltering = !isContentBased && !isPopular && hasCFMetadata
        
        // ONLY set recommendations if it's from Collaborative Filtering
        if (isCollaborativeFiltering && result.data && result.data.length > 0) {
          console.log('✅ Collaborative Filtering recommendations received!', {
            count: result.data.length,
            similarUsersCount: metadata.similarUsersCount,
            algorithm: metadata.algorithm
          })
          setRecommendations(result.data)
          setMetadata(metadata)
        } else {
          // Reject Content-Based or Popular recommendations
          console.warn('⚠️ Rejecting non-CF recommendations:', {
            isContentBased,
            isPopular,
            hasCFMetadata,
            dataCount: result.data?.length || 0,
            basedOn: basedOn
          })
          
          if (isContentBased) {
            console.warn('❌ Content-Based detected - rejecting (need Collaborative Filtering)')
          } else if (isPopular) {
            console.warn('❌ Popular/Latest detected - rejecting (need Collaborative Filtering)')
          } else if (!hasCFMetadata) {
            console.warn('❌ No CF metadata found - backend needs to implement CF algorithm')
          }
          
          // Clear recommendations - only show CF recommendations
          setRecommendations([])
          setMetadata(metadata)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error)
      setRecommendations([])
      setMetadata(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Finding users with similar preferences...</p>
          </div>
        </div>
        <FooterBar />
      </>
    )
  }

  const basedOn = metadata?.basedOn || {}
  const totalViewed = metadata?.totalViewed || metadata?.totalInteractions || 0
  
  // Detect recommendation type
  const isContentBased = !!(basedOn.districts || basedOn.types || basedOn.purposes || basedOn.priceRange)
  const isPopular = basedOn.type === 'popular' || basedOn.type === 'latest'
  const hasCFMetadata = !!(metadata?.similarUsersCount || metadata?.avgSimilarityScore || metadata?.algorithm || metadata?.kNeighbors)
  
  // ONLY show recommendations if they're from Collaborative Filtering
  // Reject Content-Based, Popular, or any non-CF recommendations
  const isPersonalized = !isContentBased && 
                         !isPopular && 
                         hasCFMetadata && 
                         recommendations.length > 0

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Collaborative Recommendations</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Properties recommended based on users with similar preferences to you
            </p>
          </div>

          {/* Insights Card */}
          {isPersonalized && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Collaborative Filtering Insights
                </CardTitle>
                <CardDescription>
                  {metadata?.similarUsersCount ? (
                    <>These recommendations are based on {metadata.similarUsersCount} users with similar preferences to you</>
                  ) : (
                    <>These recommendations are based on users with similar preferences to you</>
                  )}
                  {totalViewed > 0 && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Based on your {totalViewed} property {totalViewed === 1 ? 'interaction' : 'interactions'} (VIEW, CONTACT, WISHLIST)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Total Interactions */}
                  {totalViewed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="h-4 w-4 text-primary" />
                        Your Activity
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {totalViewed} property interactions
                      </div>
                    </div>
                  )}

                  {/* Similar Users Count */}
                  {metadata?.similarUsersCount && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-primary" />
                        Similar Users Found
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {metadata.similarUsersCount} users with similar preferences
                      </div>
                    </div>
                  )}

                  {/* Algorithm Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Recommendation Method
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User-Based Collaborative Filtering
                    </div>
                  </div>

                  {/* Average Similarity Score */}
                  {metadata?.avgSimilarityScore && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Average Similarity
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((metadata.avgSimilarityScore || 0) * 100).toFixed(1)}% match
                      </div>
                    </div>
                  )}

                  {/* K Neighbors */}
                  {metadata?.kNeighbors && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-primary" />
                        Neighbors Used
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Top {metadata.kNeighbors} similar users
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No CF Recommendations Message */}
          {!isPersonalized && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  {isContentBased ? 'Content-Based Detected' : 
                   isPopular ? 'Popular Properties Detected' : 
                   'Collaborative Filtering Not Available'}
                </CardTitle>
                <CardDescription>
                  {isContentBased ? (
                    <>
                      Backend is currently using <strong>Content-Based</strong> recommendations (based on districts, types, purposes). 
                      We only show recommendations from <strong>User-Based Collaborative Filtering</strong> algorithm. 
                      Please ask backend to implement CF algorithm according to the Viblo article.
                    </>
                  ) : isPopular ? (
                    <>
                      Backend is returning <strong>popular/latest properties</strong> instead of Collaborative Filtering recommendations. 
                      We need <strong>User-Based Collaborative Filtering</strong> based on similar users. 
                      {totalViewed > 0 && ` You have ${totalViewed} interaction${totalViewed === 1 ? '' : 's'}.`}
                    </>
                  ) : recommendations.length === 0 ? (
                    <>
                      No Collaborative Filtering recommendations available yet. 
                      {totalViewed > 0 
                        ? ` You have ${totalViewed} interaction${totalViewed === 1 ? '' : 's'}, but backend needs to rebuild Similarity Matrix or find similar users.`
                        : ' Browse properties, add them to wishlist, or contact agents to build your preference profile!'
                      }
                    </>
                  ) : (
                    <>
                      Collaborative Filtering recommendations are not available. 
                      Backend needs to implement User-Based Collaborative Filtering algorithm according to Viblo article.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => navigate('/listing/map')}>
                  Browse Properties
                </Button>
                {totalViewed > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={fetchRecommendations}
                    className="w-full"
                  >
                    Refresh Recommendations
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations Grid - ONLY show if Collaborative Filtering */}
          {isPersonalized && recommendations.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Recommended For You
                </h2>
                <Badge variant="outline" className="bg-primary/10">
                  {recommendations.length} Collaborative Filtering recommendations
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((property, index) => (
                  <div key={property._id} className="relative">
                    {/* Show prediction score if available (for debugging/transparency) */}
                    {property.predictionScore !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 right-2 z-10 bg-black/70 text-white"
                      >
                        Score: {property.predictionScore?.toFixed(2)}
                      </Badge>
                    )}
                    <PropertyCard item={property} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <FooterBar />
    </>
  )
}
