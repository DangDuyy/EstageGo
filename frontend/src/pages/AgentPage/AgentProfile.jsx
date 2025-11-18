import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, Building2, Phone, Mail, Globe, 
  Facebook, Linkedin, Twitter, Briefcase, Award, Loader2, User, MessageCircle
} from 'lucide-react'
import { searchPropertiesAPI, createOrGetConversationAPI } from '@/apis'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'
import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { toast } from 'react-toastify'

export default function AgentProfile() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [user, setUser] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [agentId])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      // Fetch any user (agent or personal)
      const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/profile/${agentId}`)
      setUser(response.data)

      // Fetch user's properties
      try {
        const propertiesData = await searchPropertiesAPI({ owner: agentId, page: 1, itemsPerPage: 10 })
        setProperties(propertiesData?.properties || propertiesData?.data || [])
      } catch (propError) {
        console.error('Error fetching user properties:', propError)
        setProperties([])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <FooterBar />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <p className="text-muted-foreground">User not found</p>
        </div>
        <FooterBar />
      </>
    )
  }

  const isAgent = user.role === 'agent'
  const isOwnProfile = currentUser?._id === user._id

  // Handle start chat
  const handleStartChat = async () => {
    if (!currentUser) {
      toast.error('Please login to send messages')
      return
    }

    if (isOwnProfile) {
      toast.info('You cannot message yourself')
      return
    }

    try {
      setStartingChat(true)
      const conversation = await createOrGetConversationAPI(user._id)
      navigate('/dashboard/messages', { state: { conversationId: conversation._id } })
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start conversation')
    } finally {
      setStartingChat(false)
    }
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
          {/* User Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <Avatar className="h-32 w-32 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback className="text-4xl">
                    {user.fullName?.charAt(0) || user.userName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-bold">{user.fullName || user.userName}</h1>
                    <Badge variant={isAgent ? "default" : "secondary"} className="text-sm">
                      {isAgent ? (
                        <>
                          <Briefcase className="h-3 w-3 mr-1" />
                          Agent
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Personal
                        </>
                      )}
                    </Badge>
                    {!isOwnProfile && currentUser && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleStartChat}
                        disabled={startingChat}
                      >
                        {startingChat ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MessageCircle className="h-4 w-4 mr-2" />
                        )}
                        Message
                      </Button>
                    )}
                  </div>
                  {isAgent && user.agentTitle && (
                    <p className="text-lg text-muted-foreground mb-4">{user.agentTitle}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {isAgent && user.companyName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <span>{user.companyName}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span>{user.address}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <a href={`tel:${user.phone}`} className="hover:text-primary">
                          {user.phone}
                        </a>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <a href={`mailto:${user.email}`} className="hover:text-primary">
                          {user.email}
                        </a>
                      </div>
                    )}
                    {isAgent && user.experience && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <span>{user.experience} years of experience</span>
                      </div>
                    )}
                    {isAgent && user.licenseNumber && (
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <span>License: {user.licenseNumber}</span>
                      </div>
                    )}
                  </div>

                  {isAgent && (
                    <div className="flex flex-wrap gap-2">
                      {user.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={user.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {user.socialLinks?.facebook && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {user.socialLinks?.linkedin && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                      {user.socialLinks?.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {isAgent && user.bio && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Specializations */}
          {isAgent && user.specializations && user.specializations.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas Served */}
          {isAgent && user.areasServed && user.areasServed.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Areas Served</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.areasServed.map((area, idx) => (
                    <Badge key={idx} variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent's Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Property Listings</CardTitle>
            </CardHeader>
            <CardContent>
              {!properties || properties.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No properties listed yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.filter(p => p && p._id).map((property) => (
                    <PropertyCard key={property._id} item={property} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <FooterBar />
    </>
  )
}
