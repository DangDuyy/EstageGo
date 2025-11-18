import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'
import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, Eye, MapPin, Home, DollarSign } from 'lucide-react'
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
      navigate('/login')
      return
    }

    fetchRecommendations()
  }, [currentUser, navigate])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const result = await getPersonalizedRecommendationsAPI(12)
      
      if (result.success) {
        setRecommendations(result.data || [])
        setMetadata(result.meta || {})
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
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
            <p className="text-muted-foreground">Analyzing your preferences...</p>
          </div>
        </div>
        <FooterBar />
      </>
    )
  }

  const basedOn = metadata?.basedOn || {}
  const totalViewed = metadata?.totalViewed || 0
  const isPersonalized = basedOn.type !== 'popular' && basedOn.type !== 'latest'

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Behavioral Recommendations</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Personalized property suggestions based on your browsing history
            </p>
          </div>

          {/* Insights Card */}
          {isPersonalized && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Your Preferences
                </CardTitle>
                <CardDescription>
                  Based on {totalViewed} properties you&apos;ve recently viewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Locations */}
                  {basedOn.districts && basedOn.districts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        Preferred Locations
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {basedOn.districts.slice(0, 3).map((district, idx) => (
                          <Badge key={idx} variant="secondary">
                            {district}
                          </Badge>
                        ))}
                        {basedOn.districts.length > 3 && (
                          <Badge variant="outline">+{basedOn.districts.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property Types */}
                  {basedOn.types && basedOn.types.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Home className="h-4 w-4 text-primary" />
                        Property Types
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {basedOn.types.map((type, idx) => (
                          <Badge key={idx} variant="secondary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  {basedOn.priceRange && basedOn.priceRange.min > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Price Range
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('vi-VN').format(Math.round(basedOn.priceRange.min))} -{' '}
                        {new Intl.NumberFormat('vi-VN').format(Math.round(basedOn.priceRange.max))} VND
                      </div>
                    </div>
                  )}

                  {/* Common Features */}
                  {basedOn.commonFeatures && basedOn.commonFeatures.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Desired Features
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {basedOn.commonFeatures.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                        {basedOn.commonFeatures.length > 2 && (
                          <Badge variant="outline">+{basedOn.commonFeatures.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No History Message */}
          {!isPersonalized && basedOn.type === 'popular' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Start Building Your Preferences</CardTitle>
                <CardDescription>
                  We&apos;re showing you popular properties. Browse more properties to get personalized recommendations!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/listing/map')}>
                  Browse Properties
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Grid */}
          {recommendations.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  {isPersonalized ? 'Recommended For You' : 'Popular Properties'}
                </h2>
                <Badge variant="outline">{recommendations.length} properties</Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((property) => (
                  <PropertyCard key={property._id} item={property} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No recommendations available at the moment.
                </p>
                <Button onClick={() => navigate('/listing/map')}>
                  Browse All Properties
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <FooterBar />
    </>
  )
}
