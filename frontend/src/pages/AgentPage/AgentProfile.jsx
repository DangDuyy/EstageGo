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
  Star, Heart, HeartOff, Edit, Trash2, Upload, X, Users, UserPlus, Shield
} from 'lucide-react'
import { 
  searchPropertiesAPI, createOrGetConversationAPI,
  getAgentReviewsAPI, getUserReviewForAgentAPI, createAgentReviewAPI, updateAgentReviewAPI, deleteAgentReviewAPI,
  checkFollowingAPI, toggleFollowAgentAPI, getAgentFollowStatsAPI, getAgentFollowersAPI, getUserFollowingAPI, getAgentFollowingAPI
} from '@/apis'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'
import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import AgentBrokerPage from '@/components/AgentPage/AgentBrokerPage'
import AgentDefaultProfile from '@/components/AgentPage/AgentDefaultProfile'
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
  const [loadingReviews, setLoadingReviews] = useState(false)

  useEffect(() => {
    fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  useEffect(() => {
    if (user && user.role === 'agent') {
      fetchReviews()
      fetchFollowData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Leave form blank for new entry; don't prefill with old review
            setReviewForm({ rating: 5, comment: '', images: [] })
            setReviewImagePreviews([])
          } else {
            setUserReview(null)
            setReviewForm({ rating: 5, comment: '', images: [] })
            setReviewImagePreviews([])
          }
        } catch {
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
    if (!agentId) {
      console.log('[fetchFollowing] agentId is empty, returning')
      return
    }
    try {
      console.log('[fetchFollowing] Fetching following for agentId:', agentId)
      setLoadingFollowing(true)
      const data = await getAgentFollowingAPI(agentId, 1, 50)
      console.log('[fetchFollowing] Success! Data received:', data)
      setFollowing(data.following || [])
    } catch (error) {
      console.error('[fetchFollowing] Error:', error)
      toast.error('Failed to load following list')
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
        } catch {
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
  const isAdmin = user?.role === 'admin'
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
  const handleSubmitReview = async (editingReviewId = null) => {
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

      if (editingReviewId) {
        // Update specific review by ID (when editing from menu)
        await updateAgentReviewAPI(editingReviewId, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          media: allMedia
        })
      } else {
        // Always create new review from the form
        await createAgentReviewAPI(agentId, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          media: allMedia
        })
      }
      setReviewImagePreviews([])
      setReviewForm({ rating: 5, comment: '', images: [] })
      await fetchReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }

  // Handle delete review
  const handleDeleteReview = async (reviewId = null) => {
    const targetReviewId = reviewId || userReview?._id
    if (!targetReviewId) return
    
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return
    }

    try {
      await deleteAgentReviewAPI(targetReviewId)
      if (!reviewId) {
        setUserReview(null)
        setReviewForm({ rating: 5, comment: '', images: [] })
        setReviewImagePreviews([])
      }
      await fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
    }
  }

  // Check if broker page is still valid
  const isBrokerPageActive = () => {
    if (!user?.brokerPage?.expireAt) return false
    const expireDate = new Date(user.brokerPage.expireAt)
    return expireDate > new Date()
  }

  // Render broker page or default profile
  const showBrokerPage = isBrokerPageActive()

  return (
    <>
      <NavBar />
      
      {showBrokerPage ? (
        // Broker Page View
        <AgentBrokerPage
          user={user}
          isFollowing={isFollowing}
          followStats={followStats}
          reviewStats={reviewStats}
          reviews={reviews}
          properties={properties}
          onStartChat={handleStartChat}
          onToggleFollow={handleToggleFollow}
          onShowFollowers={() => {
            setFollowersDialogOpen(true)
            fetchFollowers()
          }}
          onShowFollowing={() => {
            setFollowingDialogOpen(true)
            fetchFollowing()
          }}
          isChatLoading={startingChat}
          isFollowLoading={togglingFollow}
          currentUserId={currentUser?._id}
          userReview={userReview}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewImagePreviews={reviewImagePreviews}
          onReviewImageSelect={handleReviewImageSelect}
          onRemoveReviewImage={handleRemoveReviewImage}
          onSubmitReview={handleSubmitReview}
          onDeleteReview={handleDeleteReview}
          setReviewImagePreviews={setReviewImagePreviews}
          currentUser={currentUser}
          enableFollow={isAgent}
          enableReviews={isAgent}
          followersDialogOpen={followersDialogOpen}
          setFollowersDialogOpen={setFollowersDialogOpen}
          followers={followers}
          loadingFollowers={loadingFollowers}
          followingDialogOpen={followingDialogOpen}
          setFollowingDialogOpen={setFollowingDialogOpen}
          following={following}
          loadingFollowing={loadingFollowing}
        />
      ) : (
        // Default Profile View
        <div className="min-h-screen bg-background pt-32 pb-20">
          <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl">
            <AgentDefaultProfile
              user={user}
              isAgent={isAgent}
              isAdmin={isAdmin}
              isOwnProfile={isOwnProfile}
              properties={properties}
              reviews={reviews}
              reviewStats={reviewStats}
              followStats={followStats}
              isFollowing={isFollowing}
              currentUser={currentUser}
              onStartChat={handleStartChat}
              onToggleFollow={handleToggleFollow}
              onShowFollowers={() => {
                setFollowersDialogOpen(true)
                fetchFollowers()
              }}
              onShowFollowing={() => {
                setFollowingDialogOpen(true)
                fetchFollowing()
              }}
              isChatLoading={startingChat}
              isFollowLoading={togglingFollow}
              userReview={userReview}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              reviewImagePreviews={reviewImagePreviews}
              loadingReviews={loadingReviews}
              onReviewImageSelect={handleReviewImageSelect}
              onRemoveReviewImage={handleRemoveReviewImage}
              onSubmitReview={handleSubmitReview}
              onDeleteReview={handleDeleteReview}
              setReviewImagePreviews={setReviewImagePreviews}
              followersDialogOpen={followersDialogOpen}
              setFollowersDialogOpen={setFollowersDialogOpen}
              followers={followers}
              loadingFollowers={loadingFollowers}
              followingDialogOpen={followingDialogOpen}
              setFollowingDialogOpen={setFollowingDialogOpen}
              following={following}
              loadingFollowing={loadingFollowing}
            />

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
          </div>
        </div>
      )}

      <FooterBar />
    </>
  )
}
