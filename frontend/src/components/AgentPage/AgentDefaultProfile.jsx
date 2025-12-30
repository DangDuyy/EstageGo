import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
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
import { useState, useEffect } from 'react'
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
  userReview,
  reviewForm,
  setReviewForm,
  reviewImagePreviews,
  loadingReviews,
  onReviewImageSelect,
  onRemoveReviewImage,
  onSubmitReview,
  onDeleteReview
}) {
  const navigate = useNavigate()
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [showMenuId, setShowMenuId] = useState(null)
  
  // Fetch presence status for this user
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
      if (editingReviewId === reviewId) {
        handleCancelEdit()
      }
    }
  }

  return (
    <>
      {/* User Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Avatar className="h-32 w-32 shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="text-4xl">
                {user?.fullName?.charAt(0) || user?.userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 relative">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-bold">{user?.fullName || user?.userName}</h1>
                    {isAdmin && (
                      <Badge variant="destructive" className="text-sm">
                        <Award className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {isAgent && (
                      <Badge variant="default" className="text-sm">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Agent
                      </Badge>
                    )}
                    {!isAdmin && !isAgent && (
                      <Badge variant="secondary" className="text-sm">
                        <User className="h-3 w-3 mr-1" />
                        Personal
                      </Badge>
                    )}
                  </div>
                  {/* Presence Status */}
                  {!isOwnProfile && agentPresence && (
                    <PresenceBadge 
                      isOnline={agentPresence.isOnline} 
                      lastActiveAt={agentPresence.lastActiveAt}
                    />
                  )}
                  {isAgent && user?.agentTitle && (
                    <p className="text-lg text-muted-foreground mb-4">{user.agentTitle}</p>
                  )}
                </div>

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2 md:items-center md:mt-1 ml-auto">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={onStartChat}
                      disabled={isChatLoading}
                    >
                      {isChatLoading ? (
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
                        onClick={onToggleFollow}
                        disabled={isFollowLoading}
                      >
                        {isFollowLoading ? (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isAgent && user?.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span>{user.companyName}</span>
                  </div>
                )}
                {user?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${user.phone}`} className="hover:text-primary">
                      {user.phone}
                    </a>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${user.email}`} className="hover:text-primary">
                      {user.email}
                    </a>
                  </div>
                )}
              </div>

              {(user?.website || user?.socialLinks) && (
                <div className="flex gap-4 flex-wrap">
                  {user?.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {user?.socialLinks?.facebook && (
                    <a
                      href={user.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {user?.socialLinks?.linkedin && (
                    <a
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {user?.socialLinks?.twitter && (
                    <a
                      href={user.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      {user?.bio && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {isAgent && user?.experience !== null && user?.experience !== undefined && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.experience} years in real estate</p>
          </CardContent>
        </Card>
      )}

      {/* Support Services */}
      {isAgent && user?.supportServices && user.supportServices.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Services Provided</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.supportServices.map((service, idx) => (
                <Badge key={idx} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operating Areas */}
      {isAgent && user?.operatingAreas && user.operatingAreas.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Operating Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.operatingAreas.map((area, idx) => (
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
                        onClick={onShowFollowers}
                        className="text-muted-foreground"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {followStats?.totalFollowers || 0} {followStats?.totalFollowers === 1 ? 'follower' : 'followers'}
                      </Button>
                      {currentUser && currentUser._id === user._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onShowFollowing}
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
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-3">Write a Review</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 cursor-pointer transition-colors ${
                              rating <= reviewForm.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'
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
                    className="bg-white"
                  />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Images (optional, max 5)</label>
                    <div className="flex flex-wrap gap-2">
                      {reviewImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveReviewImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {reviewImagePreviews.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-orange-500 bg-white">
                          <Upload className="h-6 w-6 text-gray-400" />
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
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      {editingReviewId ? 'Update Review' : 'Submit Review'}
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

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="border-b pb-6 last:border-b-0 last:pb-0 relative group"
                    onMouseEnter={() => review.reviewer?._id === currentUser?._id && setShowMenuId(review._id)}
                    onMouseLeave={() => setShowMenuId(null)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={review.reviewer?.avatar} />
                        <AvatarFallback>
                          {review.reviewer?.fullName?.charAt(0) || review.reviewer?.userName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="gap-1 mb-2">
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
                          <p className="text-sm text-muted-foreground mb-2 break-words">{review.comment}</p>
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

                      {/* Menu 3 chấm cho review của mình */}
                      {review.reviewer?._id === currentUser?._id && showMenuId === review._id && (
                        <div className="absolute top-2 right-2">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMenuId(showMenuId === review._id ? null : review._id)
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border z-10">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(review._id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No reviews yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Properties Section */}
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
    </>
  )
}
