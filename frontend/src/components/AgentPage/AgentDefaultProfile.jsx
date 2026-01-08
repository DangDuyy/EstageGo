import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PresenceBadge } from '@/components/common/PresenceBadge'
import { usePresenceSnapshot } from '@/hooks/usePresenceSnapshot'
import { useSelector } from 'react-redux'
import { selectUsersStatus } from '@/redux/user/userSlice'
import {
  Award,
  Briefcase,
  Building2,
  Facebook,
  Globe,
  Heart, HeartOff,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Star,
  Twitter,
  User,
  UserPlus,
  Users,
  Upload,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AgentDefaultProfile({
  user,
  isAgent,
  isAdmin,
  isOwnProfile,
  properties,
  reviews,
  reviewStats,
  followStats,
  isFollowing,
  currentUser,
  onStartChat,
  onToggleFollow,
  onShowFollowers,
  onShowFollowing,
  isChatLoading,
  isFollowLoading,
  reviewForm,
  setReviewForm,
  reviewImagePreviews,
  loadingReviews,
  onReviewImageSelect,
  onRemoveReviewImage,
  onSubmitReview,
  onDeleteReview,
  setReviewImagePreviews,
  followersDialogOpen = false,
  setFollowersDialogOpen,
  followers = [],
  loadingFollowers = false,
  followingDialogOpen = false,
  setFollowingDialogOpen,
  following = [],
  loadingFollowing = false
}) {
  const navigate = useNavigate()
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [showMenuId, setShowMenuId] = useState(null)
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false)
  
  const usersStatus = useSelector(selectUsersStatus)
  usePresenceSnapshot(user?._id ? [user._id] : [])
  const agentPresence = user?._id ? usersStatus[user._id] : null

  const handleEditReview = (review) => {
    setEditingReviewId(review._id)
    setReviewForm({
      rating: review.rating,
      comment: review.comment || '',
      images: []
    })
    // Show existing images when editing so user can remove/keep them
    setReviewImagePreviews?.((review.media || []).map((mediaItem) => ({
      url: mediaItem.url,
      preview: mediaItem.url,
      type: mediaItem.type || 'image',
      isExisting: true
    })))
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setReviewForm({ rating: 5, comment: '', images: [] })
    setReviewImagePreviews?.([])
  }

  const handleSubmitReview = async () => {
    if (isReviewSubmitting) return
    setIsReviewSubmitting(true)
    try {
      if (editingReviewId) {
        await onSubmitReview(editingReviewId)
        setEditingReviewId(null)
      } else {
        await onSubmitReview()
      }
    } finally {
      setIsReviewSubmitting(false)
    }
  }

  const handleDelete = async (reviewId) => {
    await onDeleteReview(reviewId)
    setShowMenuId(null)
    if (editingReviewId === reviewId) {
      handleCancelEdit()
    }
  }

  // Configuration based on role
  const isProfessional = isAgent; // Only agents get the pro features (stats, reviews)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-gray-50/30">
      {/* 1. Header Section */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left: Avatar & Stats & Status */}
            <div className={`md:w-1/4 bg-slate-50 p-8 flex flex-col items-center border-r border-gray-100 ${!isProfessional && 'justify-center'}`}>
              <div className="flex flex-col items-center gap-4 mb-2 text-center">
                <Avatar className="h-40 w-40 shadow-xl border-4 border-white">
                  <AvatarImage src={user?.avatar} alt={user?.fullName} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-orange-100 text-orange-600 font-bold">
                    {user?.fullName?.charAt(0) || user?.userName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {!isOwnProfile && agentPresence && (
                  <div className="flex justify-center w-full">
                    <PresenceBadge 
                      isOnline={agentPresence.isOnline} 
                      lastActiveAt={agentPresence.lastActiveAt} 
                    />
                  </div>
                )}
              </div>

              {/* Followers/Following Stats - ONLY FOR AGENTS */}
              {isProfessional && (
                <div className="flex w-full justify-around pt-6 border-t border-gray-200 mt-4">
                  <button 
                    onClick={() => {setFollowersDialogOpen?.(true); onShowFollowers?.()}}
                    className="text-center group"
                  >
                    <p className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{followStats?.totalFollowers || 0}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Followers</p>
                  </button>
                  <div className="w-px h-10 bg-gray-200" />
                  <button 
                    onClick={() => {
                      console.log('[AgentDefaultProfile] Following button clicked, calling onShowFollowing')
                      setFollowingDialogOpen?.(true)
                      onShowFollowing?.()
                    }}
                    className="text-center group"
                  >
                    <p className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{followStats?.totalFollowing || 0}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Following</p>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Personal/Contact Info */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user?.fullName || user?.userName}</h1>
                      <div className="flex gap-2">
                        {isAdmin && <Badge variant="destructive" className="rounded-full shadow-sm"><Award className="h-3 w-3 mr-1" /> Admin</Badge>}
                        {isAgent && <Badge variant="default" className="rounded-full bg-blue-600 shadow-sm"><Briefcase className="h-3 w-3 mr-1" /> Agent</Badge>}
                        {!isAdmin && !isAgent && (
                          <Badge variant="secondary" className="rounded-full bg-gray-200 text-gray-700 shadow-sm">
                            <User className="h-3 w-3 mr-1" /> Personal
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isAgent && user?.agentTitle && (
                      <p className="text-lg font-medium text-blue-600/80">{user.agentTitle}</p>
                    )}
                  </div>

                  {!isOwnProfile && currentUser && (
                    <div className="flex gap-3 ml-auto">
                      <Button onClick={onStartChat} disabled={isChatLoading} className="rounded-full px-6 shadow-md shadow-primary/20 transition-all hover:scale-105">
                        {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                        Message
                      </Button>
                      {isAgent && (
                        <Button 
                          variant={isFollowing ? "outline" : "secondary"} 
                          onClick={onToggleFollow} 
                          disabled={isFollowLoading}
                          className={`rounded-full px-6 transition-all ${!isFollowing && 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                        >
                          {isFollowLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isFollowing ? <HeartOff className="h-4 w-4 mr-2" /> : <Heart className="h-4 w-4 mr-2 fill-orange-600" />}
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email</span>
                      <a href={`mailto:${user?.email}`} className="text-sm font-semibold truncate hover:text-orange-600">{user?.email || 'Not provided'}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                      <a href={`tel:${user?.phone}`} className="text-sm font-semibold hover:text-orange-600">{user?.phone || 'Not provided'}</a>
                    </div>
                  </div>

                  {isAgent && (
                    <div className="flex items-center gap-4 group">
                      <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Agency</span>
                        <span className="text-sm font-semibold">{user?.companyName || 'Freelance Agent'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 group">
                    <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Location</span>
                      <span className="text-sm font-semibold truncate">{user?.address || 'Vietnam'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Bar */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-50">
                {user?.website && (
                  <a href={user.website} target="_blank" className="p-2 rounded-full border hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {user?.socialLinks?.facebook && (
                  <a href={user.socialLinks.facebook} target="_blank" className="p-2 rounded-full border hover:bg-slate-50 hover:text-blue-700 transition-all shadow-sm">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {user?.socialLinks?.linkedin && (
                  <a href={user.socialLinks.linkedin} target="_blank" className="p-2 rounded-full border hover:bg-slate-50 hover:text-blue-800 transition-all shadow-sm">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Content Grid */}
      <div className={`grid grid-cols-1 gap-8 ${isProfessional ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        
        {/* Left Column: Bio & Properties */}
        <div className={`${isProfessional ? 'lg:col-span-2' : 'max-w-4xl mx-auto w-full'} space-y-8`}>
          {user?.bio && (
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle className="text-xl font-bold flex items-center gap-2"><User className="h-5 w-5 text-orange-500" /> About</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap italic pl-4 border-l-4 border-orange-100">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {isProfessional && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {user?.brokerPage?.yearsOfExperience !== undefined && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenure</h4>
                    <p className="text-xl font-bold">{user?.brokerPage?.yearsOfExperience} Years <span className="text-sm font-normal text-muted-foreground">in Real Estate</span></p>
                  </div>
                )}
                {user?.operatingAreas?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Service Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.operatingAreas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-600 border-none">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Properties Section - Shown for Agents or if user has listings */}
          {(isProfessional || (properties && properties.length > 0)) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-orange-600" /> Listings
                </h3>
                <Badge variant="outline" className="bg-white">{properties?.length || 0} Listed</Badge>
              </div>

              {!properties || properties.length === 0 ? (
                <Card className="border-dashed border-2 py-12 text-center bg-gray-50/50">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No properties currently listed</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.filter(p => p && p._id).map((property) => (
                    <PropertyCard key={property._id} item={property} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Reviews - ONLY FOR AGENTS */}
        {isProfessional && (
          <div className="space-y-8">
            <Card className="border-none shadow-sm h-fit sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Rating</CardTitle>
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full text-yellow-700 font-bold border border-yellow-100">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {reviewStats?.averageRating.toFixed(1) || "0.0"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Review Form */}
                {!isOwnProfile && currentUser && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100 shadow-inner text-center">
                    <p className="text-sm font-bold">Post a Feedback</p>
                    <div className="flex gap-1.5 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button key={rating} type="button" onClick={() => setReviewForm({ ...reviewForm, rating })}>
                          <Star className={`h-8 w-8 transition-all ${rating <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Share your experience..." 
                      value={reviewForm.comment} 
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="bg-white resize-none"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      {reviewImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group shrink-0">
                          <img src={preview.preview} alt="preview" className="w-12 h-12 object-cover rounded-md border" />
                          <button onClick={() => onRemoveReviewImage(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      {reviewImagePreviews.length < 5 && (
                        <label className="w-12 h-12 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-white text-gray-400">
                          <Upload className="h-5 w-5" /><Input type="file" accept="image/*" multiple onChange={onReviewImageSelect} className="hidden" />
                        </label>
                      )}
                    </div>

                    <Button 
                      onClick={handleSubmitReview} 
                      disabled={isReviewSubmitting}
                      className="w-full bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 disabled:opacity-70"
                    >
                      {isReviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                      {editingReviewId ? 'Update' : 'Post Review'}
                    </Button>
                  </div>
                )}

                {/* Reviews List */}
                <ScrollArea className="h-[400px] pr-4">
                  {loadingReviews ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review._id} className="relative group border-b border-gray-50 pb-4 last:border-0">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={review.reviewer?.avatar} />
                              <AvatarFallback>{review.reviewer?.fullName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1 min-w-0">
                              <p className="text-sm font-bold truncate">{review.reviewer?.fullName || review.reviewer?.userName}</p>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{review.comment}</p>
                              <span className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            {review.reviewer?._id === currentUser?._id && (
                              <button onClick={() => setShowMenuId(showMenuId === review._id ? null : review._id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"><MoreVertical className="h-4 w-4" /></button>
                            )}
                          </div>
                          {showMenuId === review._id && (
                            <div className="absolute right-0 top-8 z-10 bg-white shadow-xl border rounded-lg p-1 text-xs w-24">
                              <button onClick={() => handleEditReview(review)} className="w-full text-left p-2 hover:bg-slate-50 rounded font-medium">Edit</button>
                              <button onClick={() => handleDelete(review._id)} className="w-full text-left p-2 hover:bg-red-50 text-red-600 rounded font-medium">Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-10 text-sm italic">No reviews yet</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs - Kept for Agent features */}
      {isProfessional && (
        <>
          <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Followers</DialogTitle></DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {loadingFollowers ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : followers.length === 0 ? <p className="text-center py-8 text-muted-foreground">No followers found</p> : (
                  <div className="space-y-2">
                    {followers.map((follower) => (
                      <button key={follower._id} onClick={() => {navigate(`/agents/${follower._id}`); setFollowersDialogOpen?.(false)}} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                        <Avatar><AvatarImage src={follower.avatar} /><AvatarFallback>{follower.fullName?.[0]}</AvatarFallback></Avatar>
                        <div className="flex-1"><p className="font-semibold">{follower.fullName || follower.userName}</p>{follower.agentTitle && <p className="text-sm text-muted-foreground">{follower.agentTitle}</p>}</div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Following</DialogTitle></DialogHeader>
              <ScrollArea className="max-h-[400px]">
                {loadingFollowing ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : following.length === 0 ? <p className="text-center py-8 text-muted-foreground">Not following anyone</p> : (
                  <div className="space-y-2">
                    {following.map((person) => (
                      <button key={person._id} onClick={() => {navigate(`/agents/${person._id}`); setFollowingDialogOpen?.(false)}} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left">
                        <Avatar><AvatarImage src={person.avatar} /><AvatarFallback>{person.fullName?.[0]}</AvatarFallback></Avatar>
                        <div className="flex-1"><p className="font-semibold">{person.fullName || person.userName}</p>{person.agentTitle && <p className="text-sm text-muted-foreground">{person.agentTitle}</p>}</div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}