import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUser } from "@/redux/user/userSlice";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Zap, 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Ruler,
  Calendar,
  Eye,
  Heart,
  Share2,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { toast } from "react-toastify";
import { boostPropertyAPI, getPropertyStatisticsAPI } from "@/apis";
import authorizeAxiosInstance from "@/utils/authorizeAxios";
import { API_ROOT } from "@/utils/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFirstImageUrl } from '@/utils/helper';

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [boostHours, setBoostHours] = useState(48);
  const [statistics, setStatistics] = useState({ views: 0, contacts: 0, shares: 0, likes: 0 });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`);
        setProperty(response.data?.data || response.data || null);
        
        // Fetch statistics
        try {
          const statsResponse = await getPropertyStatisticsAPI(propertyId);
          if (statsResponse.success && statsResponse.data) {
            setStatistics(statsResponse.data);
          }
        } catch (statsError) {
          console.error('Failed to fetch statistics:', statsError);
          // Keep default statistics if fetch fails
        }
      } catch (error) {
        console.error('Failed to fetch property:', error);
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const formatPrice = (value, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getBoostCreditsNeeded = (durationHours = 24) => {
    // 1 credit = 24h, so 24h=1, 48h=2, 72h=3
    return Math.ceil(durationHours / 24);
  };

  const getBoostPrice = (durationHours = 24) => {
    const membership = currentUser?.membershipLevel || 'basic';
    let basePrice = 100000; 
    if (membership === 'premium') basePrice = 50000;
    else if (membership === 'standard') basePrice = 75000;
    
    if (durationHours === 24) return basePrice;
    if (durationHours === 48) return Math.floor(basePrice * 1.8);
    if (durationHours === 72) return Math.floor(basePrice * 2.5);
    return basePrice;
  };

  const getTimeSinceBoost = (bumpedAt) => {
    if (!bumpedAt) return null;
    const now = new Date();
    const boosted = new Date(bumpedAt);
    const diffMs = now - boosted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    return 'Just now';
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const end = new Date(expiresAt);
    const diffMs = end - now;
    if (diffMs <= 0) return 'Expired';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isBoostActive = () => {
    if (!property?.boostExpiresAt) return false;
    return new Date(property.boostExpiresAt) > new Date();
  };

  const getRemainingHours = () => {
    if (!property?.boostExpiresAt) return 0;
    const now = new Date();
    const end = new Date(property.boostExpiresAt);
    const diffMs = end - now;
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60));
  };

  const getNewTotalTime = () => {
    const remaining = getRemainingHours();
    const total = remaining + boostHours;
    const days = Math.floor(total / 24);
    const hours = total % 24;
    if (days > 0) return `${days} days ${hours} hours`;
    return `${hours} hours`;
  };

  const handleBoostClick = () => {
    setBoostDialogOpen(true);
  };

  const handleConfirmBoost = async () => {
    try {
      setBoosting(true);
      const creditsNeeded = getBoostCreditsNeeded(boostHours);
      const useCredits = (currentUser?.boostCredits || 0) >= creditsNeeded;
      
      await boostPropertyAPI(propertyId, useCredits, boostHours);
      
      // Update property details
      const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`);
      setProperty(response.data?.data || response.data || null);
      
      // Deduct credits from user if they were used
      if (useCredits) {
        const updatedCredits = (currentUser?.boostCredits || 0) - creditsNeeded;
        dispatch(updateUser({ boostCredits: updatedCredits }));
      }
      
      setBoostDialogOpen(false);
      toast.success(`Property boosted successfully for ${boostHours} hours! ${useCredits ? `(${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''} used)` : ''}`);
    } catch (error) {
      console.error('Boost error:', error);
      if (error.response?.status === 402) {
        toast.error('Insufficient balance. Please top up or buy boost credits.');
      } else {
        toast.error(error.response?.data?.message || 'Error boosting property');
      }
    } finally {
      setBoosting(false);
    }
  };

  const isOwner = property?.owner === currentUser?._id || property?.owner?._id === currentUser?._id;

  if (loading) {
    return (
      <ContentLayout title="Property Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </ContentLayout>
    );
  }

  if (!property) {
    return (
      <ContentLayout title="Property Details">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-muted-foreground">Listing not found</div>
          <Button onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Listing Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-muted rounded-t-lg overflow-hidden">
                  {property.media && Array.isArray(property.media) && property.media.length > 0 ? (
                    <img
                      src={getFirstImageUrl(property.media)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Badge className="bg-white/90 text-foreground uppercase">
                        {property.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                      </Badge>
                      {property.postType === 'vip' && (
                        <Badge className="bg-orange-500 text-white">VIP</Badge>
                      )}
                    </div>
                    
                    {property.bumpedAt && property.boostExpiresAt && new Date(property.boostExpiresAt) > new Date() && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg animate-pulse">
                        <Zap className="h-3 w-3 mr-1" />
                        Boost ends in: {getTimeRemaining(property.boostExpiresAt)}
                      </Badge>
                    )}
                    {property.bumpedAt && (!property.boostExpiresAt || new Date(property.boostExpiresAt) <= new Date()) && (
                      <Badge className="bg-gray-500 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        Boost expired
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {property.status === 'active' ? 'Active' : property.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{property.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  {property.address?.fullAddress}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(property.price?.value, property.price?.currency)}
                  </span>
                  {property.price?.period && property.price.period !== 'other' && (
                    <span className="text-muted-foreground">/ {property.price.period === 'month' ? 'month' : 'year'}</span>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.area} m²</div>
                      <div className="text-xs text-muted-foreground">Area</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.rooms?.bedrooms || 0}</div>
                      <div className="text-xs text-muted-foreground">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.rooms?.bathrooms || 0}</div>
                      <div className="text-xs text-muted-foreground">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium capitalize">{property.type}</div>
                      <div className="text-xs text-muted-foreground">Type</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isOwner && (
            <div className="space-y-6">
              {property.status === 'active' && (
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <Zap className="h-5 w-5" />
                      Boost Listing
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Increase visibility of your post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {property.boostExpiresAt && new Date(property.boostExpiresAt) > new Date() ? (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-semibold text-green-700">Boost Active</span>
                          </div>
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700">Time remaining:</span>
                            <span className="font-bold text-lg text-green-600">
                              {getTimeRemaining(property.boostExpiresAt)}
                            </span>
                          </div>
                          
                          {(() => {
                            const now = new Date();
                            const start = new Date(property.bumpedAt || property.createdAt);
                            const end = new Date(property.boostExpiresAt);
                            const total = end - start;
                            const remaining = Math.max(0, end - now);
                            const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
                            
                            return (
                              <div className="space-y-1">
                                <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <div className="text-xs text-green-600 text-right">
                                  {Math.round(percent)}% time left
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Your listing is currently prioritized
                        </div>
                      </div>
                    ) : property.bumpedAt ? (
                      <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-gray-400 rounded-full" />
                            <span className="font-semibold text-gray-600">Boost Expired</span>
                          </div>
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Last boost: {getTimeSinceBoost(property.bumpedAt)}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold text-orange-700">Never Boosted</span>
                        </div>
                        <div className="text-sm text-orange-600 mt-2">
                          Boost now to reach more buyers!
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Total boost count:</span>
                      <span className="font-medium">{property.bumpCount || 0} times</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Boost Fee:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {(currentUser?.boostCredits || 0) >= getBoostCreditsNeeded(boostHours) ? (
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {getBoostCreditsNeeded(boostHours)} credit{getBoostCreditsNeeded(boostHours) > 1 ? 's' : ''}
                            </span>
                          ) : (
                            formatPrice(getBoostPrice(boostHours), 'USD')
                          )}
                        </span>
                      </div>
                      
                      {(currentUser?.boostCredits || 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          You have {currentUser.boostCredits} credits left
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="lg"
                      onClick={handleBoostClick}
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Boost Now
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Your listing will appear at the top of search results
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Views
                    </div>
                    <span className="font-semibold">{statistics.views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      Likes
                    </div>
                    <span className="font-semibold">{statistics.likes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      Shares
                    </div>
                    <span className="font-semibold">{statistics.shares}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Posted Date
                    </div>
                    <span className="text-sm">
                      {new Date(property.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  
                  {property.expireAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Expiry Date
                      </div>
                      <span className="text-sm">
                        {new Date(property.expireAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Listing Fee
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(property.listingFee || 0, 'USD')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Confirm Boost
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <p className="text-foreground">
                  {isBoostActive() 
                    ? `This listing is currently boosted. Select duration to extend:`
                    : `Are you sure you want to boost this listing to the top?`}
                </p>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Listing:</span>
                    <span className="font-medium truncate ml-2">{property.title}</span>
                  </div>
                  
                  {property.bumpedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Last Boost:</span>
                      <span className="font-medium">{getTimeSinceBoost(property.bumpedAt)}</span>
                    </div>
                  )}
                  
                  {isBoostActive() && (
                    <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span className="text-green-700">Remaining Time:</span>
                      <span className="font-semibold text-green-600">{getTimeRemaining(property.boostExpiresAt)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Select {isBoostActive() ? 'extension' : 'boost'} duration:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[24, 48, 72].map(h => {
                        const creditsNeeded = getBoostCreditsNeeded(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setBoostHours(h)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              boostHours === h
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-bold text-foreground">{h}h</div>
                            <div className={`text-xs mt-1 ${
                              (currentUser?.boostCredits || 0) >= creditsNeeded
                                ? 'text-purple-600 font-medium'
                                : 'text-muted-foreground'
                            }`}>
                              {(currentUser?.boostCredits || 0) >= creditsNeeded
                                ? `${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''}`
                                : formatPrice(getBoostPrice(h), 'USD')
                              }
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isBoostActive() && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <span className="font-medium">ℹ️ Total time after boost:</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {getNewTotalTime()}
                      </div>
                      <div className="text-xs text-blue-600">
                        ({getRemainingHours()}h left + {boostHours}h new = {getRemainingHours() + boostHours}h)
                      </div>
                    </div>
                  )}

                  {(currentUser?.boostCredits || 0) >= getBoostCreditsNeeded(boostHours) ? (
                    <div className="bg-purple-50 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Using:</span>
                        <span className="font-semibold text-purple-600">{getBoostCreditsNeeded(boostHours)} Boost Credit{getBoostCreditsNeeded(boostHours) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Credits remaining:</span>
                        <span>{(currentUser?.boostCredits || 0) - getBoostCreditsNeeded(boostHours)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">Boost Fee ({boostHours}h):</div>
                          {boostHours > 24 && (
                            <div className="text-xs text-green-600 mt-1">
                              Save {Math.round(((getBoostPrice(24) * (boostHours/24)) - getBoostPrice(boostHours)) / 1000)}k!
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg text-orange-600">
                          {formatPrice(getBoostPrice(boostHours), 'USD')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>✨ Your listing will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Appear in the first position</li>
                    <li>Be prioritized in visibility</li>
                    <li>Increase chances of being viewed by buyers</li>
                    {isBoostActive() 
                      ? <li className="font-medium text-blue-600">Duration will be extended by {boostHours}h</li>
                      : <li>Valid for {boostHours} hours</li>
                    }
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={boosting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBoost}
              disabled={boosting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {boosting ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Boosting...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {isBoostActive() ? `Add ${boostHours}h` : `Confirm ${boostHours}h Boost`}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
}