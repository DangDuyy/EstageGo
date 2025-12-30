import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PresenceBadge } from '@/components/common/PresenceBadge'
import { usePresenceSnapshot } from '@/hooks/usePresenceSnapshot'
import { useSelector } from 'react-redux'
import { selectUsersStatus } from '@/redux/user/userSlice'
import {
  Award,
  Building2,
  Globe,
  Heart,
  HeartOff,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Star,
  Users,
  Upload,
  X,
  Home,
  Shield
} from 'lucide-react'
import { useState } from 'react'
import PropertyCard from '../common/Property/FeatureCard/PropertyCard'

export default function AgentBrokerPage({
  user,
  isFollowing,
  followStats,
  reviewStats,
  reviews = [],
  properties = [],
  onStartChat,
  onToggleFollow,
  onShowFollowers,
  isChatLoading,
  isFollowLoading,
  currentUserId,
  userReview,
  reviewForm,
  setReviewForm,
  reviewImagePreviews,
  onReviewImageSelect,
  onRemoveReviewImage,
  onSubmitReview,
  onDeleteReview,
  currentUser,
  enableFollow = true,
  enableReviews = true
}) {
  const isOwnProfile = currentUserId === user?._id
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [showMenuId, setShowMenuId] = useState(null)
  
  // Fetch presence status
  const usersStatus = useSelector(selectUsersStatus)
  usePresenceSnapshot(user?._id ? [user._id] : [])
  const agentPresence = user?._id ? usersStatus[user._id] : null

  const handleEditReview = (review) => {
    setEditingReviewId(review._id)
    setReviewForm({
      rating: review.rating,
      comment: review.comment,
      images: []
    })
    setShowMenuId(null)
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setReviewForm({ rating: 5, comment: '', images: [] })
  }

  const handleSubmitWithId = async () => {
    await onSubmitReview(editingReviewId)
    setEditingReviewId(null)
  }

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await onDeleteReview(reviewId)
      setShowMenuId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner with Cover Image */}
      <div className="relative w-full h-64 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        {user?.brokerPage?.coverImage ? (
          <img
            src={user.brokerPage.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        {/* Profile Header Card */}
        <Card className="mb-8 shadow-xl border">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <Avatar className="h-40 w-40 border-4 border-background shadow-2xl ring-4 ring-emerald-100 dark:ring-emerald-900">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                      {user?.fullName?.charAt(0) || user?.userName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {user?.brokerPage?.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2 shadow-lg">
                      <Shield className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                      {user?.fullName || user?.userName}
                      {user?.brokerPage?.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300">
                          Verified
                        </Badge>
                      )}
                    </h1>
                    {user?.brokerPage?.agentTitle && (
                      <p className="text-lg text-emerald-600 dark:text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {user.brokerPage.agentTitle}
                      </p>
                    )}
                    {/* Presence Status */}
                    {!isOwnProfile && agentPresence && (
                      <div className="mb-3">
                        <PresenceBadge 
                          isOnline={agentPresence.isOnline} 
                          lastActiveAt={agentPresence.lastActiveAt}
                        />
                      </div>
                    )}
                    {user?.companyName && (
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 className="h-5 w-5" />
                        <span className="font-medium">{user.companyName}</span>
                      </div>
                    )}
                    {user?.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <span className="text-sm">{user.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="flex gap-3">
                      <Button
                        onClick={onStartChat}
                        disabled={isChatLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        {isChatLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <MessageCircle className="h-5 w-5 mr-2" />
                        )}
                        Chat
                      </Button>
                      {enableFollow && (
                        <Button
                          variant={isFollowing ? 'outline' : 'default'}
                          onClick={onToggleFollow}
                          disabled={isFollowLoading}
                          className={`shadow-lg hover:shadow-xl transition-all ${
                            isFollowing
                              ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                          }`}
                          size="lg"
                        >
                          {isFollowLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : isFollowing ? (
                            <>
                              <HeartOff className="h-5 w-5 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <Heart className="h-5 w-5 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={onStartChat}
                        variant="outline"
                        size="lg"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Contact
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-500 rounded-lg p-2">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {user?.brokerPage?.yearsOfExperience ?? user?.experience ?? 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Years of Experience</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-800">
                    <div className="flex justify-center mb-2">
                      <div className="bg-amber-500 rounded-lg p-2">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {properties?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Properties</p>
                  </div>

                  {reviewStats && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
                      <div className="flex justify-center mb-2">
                        <div className="bg-yellow-500 rounded-lg p-2">
                          <Star className="h-5 w-5 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ({reviewStats.totalReviews} reviews)
                      </p>
                    </div>
                  )}

                  {followStats && (
                    <button
                      onClick={onShowFollowers}
                      className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-center mb-2">
                        <div className="bg-emerald-500 rounded-lg p-2">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold">
                        {followStats.totalFollowers || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Followers</p>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Properties */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            {(user?.bio || user?.brokerPage?.bio) && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {user?.brokerPage?.bio || user?.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="bg-emerald-100 dark:bg-emerald-900 rounded-lg p-2 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                      <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone}</p>
                    </div>
                  </a>
                )}
                {user?.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                  </a>
                )}
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                      <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="text-sm font-medium truncate">Visit website</p>
                    </div>
                  </a>
                )}

                {user?.brokerPage?.supportServices && user.brokerPage.supportServices.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">Support Services</p>
                    <div className="flex flex-wrap gap-2">
                      {user.brokerPage.supportServices.map((service, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operating Areas */}
            {user?.brokerPage?.operatingAreas && user.brokerPage.operatingAreas.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Operating Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.brokerPage.operatingAreas.map((area, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Listings */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Listed Properties ({properties?.length || 0})
                  </span>
                  {properties?.length > 0 && (
                    <Button variant="link" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                      View all
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!properties || properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">No properties yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.filter(p => p && p._id).slice(0, 6).map((property) => (
                      <PropertyCard key={property._id} item={property} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reviews Only */}
          <div className="space-y-6">
            {/* Reviews Card */}
            {enableReviews && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Customer Reviews ({reviewStats?.totalReviews || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Review Form - Giữ nguyên không sticky */}
                  {currentUser && !isOwnProfile && (
                    <div className="mb-6 p-4 rounded-xl bg-accent border">
                      <h4 className="font-semibold mb-4">Write a Review</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Rating
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-8 w-8 cursor-pointer transition-colors ${
                                    star <= reviewForm.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-muted-foreground hover:text-yellow-400'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          placeholder="Share your experience..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows={3}
                        />
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Images (optional, max 5)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {reviewImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => onRemoveReviewImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {reviewImagePreviews.length < 5 && (
                              <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-accent transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={onReviewImageSelect}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={editingReviewId ? handleSubmitWithId : () => onSubmitReview()}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                          >
                            {editingReviewId ? 'Update' : 'Submit Review'}
                          </Button>
                          {editingReviewId && (
                            <Button onClick={handleCancelEdit} variant="outline">
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {!reviews || reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 6).map((review) => (
                        <div
                          key={review._id}
                          className="p-4 rounded-xl border hover:shadow-md transition-shadow relative"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-border">
                              <AvatarImage src={review.reviewer?.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                {review.reviewer?.fullName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold">
                                    {review.reviewer?.fullName || review.reviewer?.userName || 'User'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < (review.rating || 0)
                                              ? 'text-yellow-500 fill-yellow-500'
                                              : 'text-muted-foreground'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">4 weeks ago</span>
                                  </div>
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>
                              )}
                              
                              {/* Review Images */}
                              {review.media && review.media.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {review.media.map((mediaItem, idx) => (
                                    <img
                                      key={mediaItem._id || idx}
                                      src={mediaItem.url}
                                      alt={`Review image ${idx + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border-2 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(mediaItem.url, '_blank')}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {review.reviewer?._id === currentUserId && (
                              <div className="absolute top-3 right-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowMenuId(showMenuId === review._id ? null : review._id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                                {showMenuId === review._id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-popover rounded-lg shadow-xl border z-10 overflow-hidden">
                                    <button
                                      onClick={() => handleEditReview(review)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(review._id)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-accent transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {reviews.length > 6 && (
                        <Button variant="outline" className="w-full">
                          View all {reviews.length} reviews
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}