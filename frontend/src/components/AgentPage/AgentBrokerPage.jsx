import PropertyCard from '@/components/common/Property/FeatureCard/PropertyCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Award,
  Building2,
  Globe,
  Heart, HeartOff,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Star, Users,
  Upload,
  X
} from 'lucide-react'
import { useState } from 'react'

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
  currentUser
}) {
  const isOwnProfile = currentUserId === user?._id
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [showMenuId, setShowMenuId] = useState(null)

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
    <div className="min-h-screen bg-linear-to-b from-amber-50 to-white">
      {/* Cover & Avatar Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-linear-to-r from-amber-400 via-orange-400 to-amber-500">
          {user?.brokerPage?.coverImage && (
            <img 
              src={user.brokerPage.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Avatar */}
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative -mt-20 mb-8">
            <Avatar className="h-40 w-40 border-8 border-white shadow-lg">
              <AvatarImage src={user?.avatar} alt={user?.fullName} />
              <AvatarFallback className="text-4xl bg-orange-200">
                {user?.fullName?.charAt(0) || user?.userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl pb-20">
        {/* Agent Info Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user?.fullName || user?.userName}
              </h1>
              {user?.brokerPage?.agentTitle && (
                <p className="text-xl text-orange-600 font-semibold mb-4">
                  {user.brokerPage.agentTitle}
                </p>
              )}
              {user?.companyName && (
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{user.companyName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(user?.brokerPage?.yearsOfExperience !== null && user?.brokerPage?.yearsOfExperience !== undefined) ||
             (user?.experience !== null && user?.experience !== undefined) ? (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Award className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {user?.brokerPage?.yearsOfExperience ?? user?.experience}
                    </div>
                    <p className="text-sm text-gray-600">Years Experience</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {reviewStats && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2 fill-yellow-500" />
                    <div className="text-2xl font-bold text-gray-900">
                      {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">({reviewStats.totalReviews})</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {followStats && (
              <Card>
                <CardContent className="p-4">
                  <button
                    onClick={onShowFollowers}
                    className="text-center w-full hover:opacity-80 transition"
                  >
                    <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {followStats.totalFollowers || 0}
                    </div>
                    <p className="text-sm text-gray-600">Followers</p>
                  </button>
                </CardContent>
              </Card>
            )}
            
            {/* Action Buttons */}
            {!isOwnProfile && (
              <Card className="md:col-span-2 lg:col-span-1">
                <CardContent className="p-4 flex flex-col gap-3">
                  <Button 
                    onClick={onStartChat}
                    disabled={isChatLoading}
                    className="bg-orange-500 hover:bg-orange-600 w-full"
                    size="lg"
                  >
                    {isChatLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-5 w-5 mr-2" />
                    )}
                    Message
                  </Button>
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    onClick={onToggleFollow}
                    disabled={isFollowLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isFollowLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : isFollowing ? (
                      <HeartOff className="h-5 w-5 mr-2" />
                    ) : (
                      <Heart className="h-5 w-5 mr-2" />
                    )}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main two-column layout: left content + right reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Contact, Services, Areas, Bio */}
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                
                <div className="space-y-3">
                  {user?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-orange-500" />
                      <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                        {user.phone}
                      </a>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                        {user.email}
                      </a>
                    </div>
                  )}
                  {user?.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <span>{user.address}</span>
                    </div>
                  )}
                  {user?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-orange-500" />
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <span>Visit Website</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {user?.brokerPage?.supportServices && user.brokerPage.supportServices.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Services Provided</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.brokerPage.supportServices.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs md:text-sm">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {user?.brokerPage?.operatingAreas && user.brokerPage.operatingAreas.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Operating Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.brokerPage.operatingAreas.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs md:text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(user?.bio || user?.brokerPage?.bio) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {user?.brokerPage?.bio || user?.bio}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Reviews */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewStats && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{reviewStats.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{reviewStats.totalReviews} reviews</span>
                  </div>
                )}

                {/* Review Form */}
                {currentUser && !isOwnProfile && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold mb-3">Write a Review</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 cursor-pointer transition-colors ${
                                  star <= reviewForm.rating
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
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!reviews || reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 6).map((review) => (
                      <div 
                        key={review._id} 
                        className="p-3 rounded-lg border relative group"
                        onMouseEnter={() => review.reviewer?._id === currentUserId && setShowMenuId(review._id)}
                        onMouseLeave={() => setShowMenuId(null)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.reviewer?.avatar} />
                            <AvatarFallback>
                              {review.reviewer?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{review.reviewer?.fullName || review.reviewer?.userName || 'User'}</span>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`${i < (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} h-4 w-4`} />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 break-words">{review.comment}</p>
                            )}
                          </div>

                          {/* Menu 3 chấm - chỉ hiện với review của mình */}
                          {review.reviewer?._id === currentUserId && showMenuId === review._id && (
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Listings Section */}
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
  )
}
