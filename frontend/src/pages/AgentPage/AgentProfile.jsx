import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, Building2, Phone, Mail, Globe, 
  Facebook, Linkedin, Twitter, Briefcase, Award, Loader2, User, MessageCircle,
  Star, Heart, HeartOff, Edit, Trash2, Upload, X, Users, UserPlus
} from 'lucide-react'
import { 
  searchPropertiesAPI, createOrGetConversationAPI,
  getAgentReviewsAPI, getUserReviewForAgentAPI, createAgentReviewAPI, updateAgentReviewAPI, deleteAgentReviewAPI,
  checkFollowingAPI, toggleFollowAgentAPI, getAgentFollowStatsAPI, getAgentFollowersAPI, getUserFollowingAPI
} from '@/apis'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [userReview, setUserReview] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', images: [] })
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false)
  const [followStats, setFollowStats] = useState({ totalFollowers: 0 })
  const [togglingFollow, setTogglingFollow] = useState(false)
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false)
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [agentId])

  useEffect(() => {
    if (user && user.role === 'agent') {
      fetchReviews()
      fetchFollowData()
    }
  }, [user, currentUser, agentId])

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

  const fetchReviews = async () => {
    if (!user || user.role !== 'agent') return
    try {
      setLoadingReviews(true)
      const data = await getAgentReviewsAPI(agentId, 1, 10)
      setReviews(data.reviews || [])
      setReviewStats(data.stats || null)
      
      // Fetch user's review if logged in
      if (currentUser && currentUser._id !== user._id) {
        try {
          const userReviewData = await getUserReviewForAgentAPI(agentId)
          if (userReviewData.review) {
            setUserReview(userReviewData.review)
            setReviewForm({
              rating: userReviewData.review.rating,
              comment: userReviewData.review.comment || '',
              images: userReviewData.review.media || []
            })
            // Set existing images as previews (for display only, not for re-upload)
            if (userReviewData.review.media && userReviewData.review.media.length > 0) {
              setReviewImagePreviews(
                userReviewData.review.media
                  .filter(m => m.type === 'image')
                  .map((mediaItem, idx) => ({
                    file: null, // No file object for existing images
                    preview: mediaItem.url,
                    isExisting: true,
                    url: mediaItem.url
                  }))
              )
            }
          } else {
            setUserReview(null)
            setReviewForm({ rating: 5, comment: '', images: [] })
            setReviewImagePreviews([])
          }
        } catch (err) {
          // User hasn't reviewed yet
          setUserReview(null)
          setReviewForm({ rating: 5, comment: '', images: [] })
          setReviewImagePreviews([])
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const fetchFollowers = async () => {
    if (!agentId) return
    try {
      setLoadingFollowers(true)
      const data = await getAgentFollowersAPI(agentId, 1, 50)
      console.log('Followers data:', data) // Debug log
      const followersList = data.followers || data.data?.followers || []
      setFollowers(followersList.filter(f => f !== null && f !== undefined))
    } catch (error) {
      console.error('Error fetching followers:', error)
      toast.error('Failed to load followers')
    } finally {
      setLoadingFollowers(false)
    }
  }

  const fetchFollowing = async () => {
    if (!currentUser) return
    try {
      setLoadingFollowing(true)
      const data = await getUserFollowingAPI(1, 50)
      setFollowing(data.following || [])
    } catch (error) {
      console.error('Error fetching following:', error)
    } finally {
      setLoadingFollowing(false)
    }
  }

  const fetchFollowData = async () => {
    if (!user || user.role !== 'agent') return
    try {
      // Get follow stats (public)
      const statsData = await getAgentFollowStatsAPI(agentId)
      setFollowStats(statsData)
      
      // Check if following (only if logged in and not own profile)
      if (currentUser && currentUser._id !== user._id) {
        try {
          const followData = await checkFollowingAPI(agentId)
          setIsFollowing(followData.isFollowing || false)
        } catch (err) {
          setIsFollowing(false)
        }
      }
    } catch (error) {
      console.error('Error fetching follow data:', error)
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

  const isAgent = user?.role === 'agent'
  const isOwnProfile = currentUser?._id === user?._id

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

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to follow agents')
      return
    }

    if (isOwnProfile) {
      toast.info('You cannot follow yourself')
      return
    }

    try {
      setTogglingFollow(true)
      const result = await toggleFollowAgentAPI(agentId)
      setIsFollowing(result.action === 'added')
      await fetchFollowData()
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error(error.response?.data?.message || 'Failed to update follow status')
    } finally {
      setTogglingFollow(false)
    }
  }

  // Handle review image upload
  const handleReviewImageSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPreviews = files.map(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return null
      }
      return {
        file,
        preview: URL.createObjectURL(file),
        isExisting: false
      }
    }).filter(Boolean)

    const currentCount = reviewImagePreviews.length
    const remainingSlots = 5 - currentCount
    const toAdd = newPreviews.slice(0, remainingSlots)
    
    setReviewImagePreviews(prev => [...prev, ...toAdd].slice(0, 5)) // Max 5 images
    e.target.value = '' // Reset input
  }

  const handleRemoveReviewImage = (index) => {
    setReviewImagePreviews(prev => {
      const item = prev[index]
      // Only revoke URL if it's a new upload (not existing image)
      if (!item.isExisting && item.preview && item.preview.startsWith('blob:')) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // Upload images and get URLs
  const uploadReviewImages = async (files) => {
    if (files.length === 0) return []
    
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/agent-reviews/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Return array of media objects with url and type
      return (response.data.media || []).map(item => ({
        url: item.url,
        type: item.type || 'image'
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
      return []
    }
  }

  // Handle review submit
  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast.error('Please login to submit a review')
      return
    }

    if (!reviewForm.rating) {
      toast.error('Please select a rating')
      return
    }

    try {
      // Upload only new images (not existing ones)
      const newImageFiles = reviewImagePreviews
        .filter(p => p.file && !p.isExisting)
        .map(p => p.file)
      
      // Get existing image URLs
      const existingImages = reviewImagePreviews
        .filter(p => p.isExisting && p.url)
        .map(p => ({ url: p.url, type: 'image' }))
      
      // Upload new images
      const uploadedMedia = await uploadReviewImages(newImageFiles)
      
      // Combine existing and new images
      const allMedia = [...existingImages, ...uploadedMedia]

      if (userReview) {
        // Update existing review
        await updateAgentReviewAPI(userReview._id, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          media: allMedia
        })
      } else {
        // Create new review
        await createAgentReviewAPI(agentId, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          media: allMedia
        })
      }
      setReviewDialogOpen(false)
      setReviewImagePreviews([])
      await fetchReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }

  // Handle delete review
  const handleDeleteReview = async () => {
    if (!userReview) return
    
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return
    }

    try {
      await deleteAgentReviewAPI(userReview._id)
      setUserReview(null)
      setReviewForm({ rating: 5, comment: '', images: [] })
      setReviewImagePreviews([])
      await fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
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

                <div className="flex-1 relative">
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
                      <div className="flex gap-2 ml-auto">
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
                        {isAgent && (
                          <Button 
                            variant={isFollowing ? "outline" : "default"} 
                            size="sm"
                            onClick={handleToggleFollow}
                            disabled={togglingFollow}
                          >
                            {togglingFollow ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : isFollowing ? (
                              <HeartOff className="h-4 w-4 mr-2" />
                            ) : (
                              <Heart className="h-4 w-4 mr-2" />
                            )}
                            {isFollowing ? 'Unfollow' : 'Follow'}
                          </Button>
                        )}
                      </div>
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

          {/* Reviews Section */}
          {isAgent && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  {reviewStats && (
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                      {isAgent && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFollowersDialogOpen(true)
                              fetchFollowers()
                            }}
                            className="text-muted-foreground"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {followStats.totalFollowers || 0} {followStats.totalFollowers === 1 ? 'follower' : 'followers'}
                          </Button>
                          {currentUser && currentUser._id === user._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFollowingDialogOpen(true)
                                fetchFollowing()
                              }}
                              className="text-muted-foreground"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Following
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isOwnProfile && currentUser && (
                  <div className="mb-6">
                    {userReview ? (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < userReview.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              Your review
                            </span>
                          </div>
                          {userReview.comment && (
                            <p className="text-sm mb-2">{userReview.comment}</p>
                          )}
                          {userReview.media && userReview.media.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {userReview.media.map((mediaItem, idx) => (
                                mediaItem.type === 'image' && (
                                  <img
                                    key={idx}
                                    src={mediaItem.url}
                                    alt={`Review image ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(mediaItem.url, '_blank')}
                                  />
                                )
                              ))}
                            </div>
                          )}
                        </div>
                        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Your Review</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Rating</label>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                                      className="focus:outline-none"
                                    >
                                      <Star
                                        className={`h-8 w-8 ${
                                          rating <= reviewForm.rating
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Comment</label>
                                <Textarea
                                  value={reviewForm.comment}
                                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                  placeholder="Share your experience..."
                                  rows={4}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Images (optional, max 5)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {reviewImagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={preview.preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveReviewImage(index)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {reviewImagePreviews.length < 5 && (
                                    <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary">
                                      <Upload className="h-6 w-6 text-muted-foreground" />
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleReviewImageSelect}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSubmitReview}>Update Review</Button>
                                <Button variant="destructive" onClick={handleDeleteReview}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Star className="h-4 w-4 mr-2" />
                            Write a Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Rating</label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                                    className="focus:outline-none"
                                  >
                                    <Star
                                      className={`h-8 w-8 ${
                                        rating <= reviewForm.rating
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Comment</label>
                              <Textarea
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                placeholder="Share your experience..."
                                rows={4}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Images (optional, max 5)</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {reviewImagePreviews.map((preview, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={preview.preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveReviewImage(index)}
                                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                {reviewImagePreviews.length < 5 && (
                                  <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleReviewImageSelect}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                            <Button onClick={handleSubmitReview}>Submit Review</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}

                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => navigate(`/agents/${review.reviewer?._id}`)}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-10 w-10 cursor-pointer">
                              <AvatarImage src={review.reviewer?.avatar} />
                              <AvatarFallback>
                                {review.reviewer?.fullName?.charAt(0) || review.reviewer?.userName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => navigate(`/agents/${review.reviewer?._id}`)}
                                className="font-semibold hover:text-primary transition-colors"
                              >
                                {review.reviewer?.fullName || review.reviewer?.userName}
                              </button>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                            )}
                            {review.media && review.media.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {review.media.map((mediaItem, idx) => (
                                  mediaItem.type === 'image' && (
                                    <img
                                      key={idx}
                                      src={mediaItem.url}
                                      alt={`Review image ${idx + 1}`}
                                      className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                      onClick={() => window.open(mediaItem.url, '_blank')}
                                    />
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Followers Dialog */}
          <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Followers</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {loadingFollowers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : followers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No followers yet</p>
                ) : (
                  <div className="space-y-2">
                    {followers.map((follower) => (
                      <button
                        key={follower._id}
                        onClick={() => {
                          navigate(`/agents/${follower._id}`)
                          setFollowersDialogOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={follower.avatar} />
                          <AvatarFallback>
                            {follower.fullName?.charAt(0) || follower.userName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{follower.fullName || follower.userName}</p>
                          {follower.agentTitle && (
                            <p className="text-sm text-muted-foreground">{follower.agentTitle}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Following Dialog */}
          <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Following</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {loadingFollowing ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : following.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Not following anyone yet</p>
                ) : (
                  <div className="space-y-2">
                    {following.map((agent) => (
                      <button
                        key={agent._id}
                        onClick={() => {
                          navigate(`/agents/${agent._id}`)
                          setFollowingDialogOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>
                            {agent.fullName?.charAt(0) || agent.userName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{agent.fullName || agent.userName}</p>
                          {agent.agentTitle && (
                            <p className="text-sm text-muted-foreground">{agent.agentTitle}</p>
                          )}
                          {agent.companyName && (
                            <p className="text-xs text-muted-foreground">{agent.companyName}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

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
