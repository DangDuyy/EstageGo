import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, Building2, Phone, Mail, Globe, 
  Facebook, Linkedin, Twitter, Briefcase, Award, Loader2
} from 'lucide-react'
import { getAgentByIdAPI, searchPropertiesAPI } from '@/apis'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'
import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'

export default function AgentProfile() {
  const { agentId } = useParams()
  const [agent, setAgent] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentData()
  }, [agentId])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      const agentData = await getAgentByIdAPI(agentId)
      setAgent(agentData)

      // Fetch agent's properties
      const propertiesData = await searchPropertiesAPI({ owner: agentId, page: 1, itemsPerPage: 10 })
      setProperties(propertiesData.properties || [])
    } catch (error) {
      console.error('Error fetching agent data:', error)
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

  if (!agent) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <p className="text-muted-foreground">Agent not found</p>
        </div>
        <FooterBar />
      </>
    )
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Agent Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <Avatar className="h-32 w-32 shrink-0">
                  <AvatarImage src={agent.avatar} alt={agent.fullName} />
                  <AvatarFallback className="text-4xl">
                    {agent.fullName?.charAt(0) || agent.userName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{agent.fullName || agent.userName}</h1>
                  {agent.agentTitle && (
                    <p className="text-lg text-muted-foreground mb-4">{agent.agentTitle}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {agent.companyName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <span>{agent.companyName}</span>
                      </div>
                    )}
                    {agent.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span>{agent.address}</span>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <a href={`tel:${agent.phone}`} className="hover:text-primary">
                          {agent.phone}
                        </a>
                      </div>
                    )}
                    {agent.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <a href={`mailto:${agent.email}`} className="hover:text-primary">
                          {agent.email}
                        </a>
                      </div>
                    )}
                    {agent.experience && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <span>{agent.experience} years of experience</span>
                      </div>
                    )}
                    {agent.licenseNumber && (
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <span>License: {agent.licenseNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {agent.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={agent.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {agent.socialLinks?.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={agent.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4 mr-2" />
                          Facebook
                        </a>
                      </Button>
                    )}
                    {agent.socialLinks?.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={agent.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {agent.socialLinks?.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={agent.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {agent.bio && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{agent.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Specializations */}
          {agent.specializations && agent.specializations.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas Served */}
          {agent.areasServed && agent.areasServed.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Areas Served</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.areasServed.map((area, idx) => (
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
              {properties.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No properties listed yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property._id} property={property} />
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
