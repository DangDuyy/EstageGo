import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { toast } from "react-toastify";
import { boostPropertyAPI } from "@/apis";
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

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [boostHours, setBoostHours] = useState(48);

  useEffect(() => {
    // Fetch property details
    const fetchProperty = async () => {
      try {
        const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`);
        // API returns the property object at root (not wrapped in data)
        setProperty(response.data?.data || response.data || null);
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getBoostPrice = (durationHours = 24) => {
    const membership = currentUser?.membershipLevel || 'basic';
    let basePrice = 100000; // basic
    if (membership === 'premium') basePrice = 50000;
    else if (membership === 'standard') basePrice = 75000;
    
    // Pricing based on duration
    if (durationHours === 24) return basePrice;
    if (durationHours === 48) return Math.floor(basePrice * 1.8); // 80% more
    if (durationHours === 72) return Math.floor(basePrice * 2.5); // 150% more
    return basePrice;
  };

  const getTimeSinceBoost = (bumpedAt) => {
    if (!bumpedAt) return null;
    const now = new Date();
    const boosted = new Date(bumpedAt);
    const diffMs = now - boosted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    return 'Vừa xong';
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const end = new Date(expiresAt);
    const diffMs = end - now;
    if (diffMs <= 0) return 'Đã hết hiệu lực';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
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
    return Math.ceil(diffMs / (1000 * 60 * 60)); // Convert to hours
  };

  const getNewTotalTime = () => {
    const remaining = getRemainingHours();
    const total = remaining + boostHours;
    const days = Math.floor(total / 24);
    const hours = total % 24;
    if (days > 0) return `${days} ngày ${hours} giờ`;
    return `${hours} giờ`;
  };

  const handleBoostClick = () => {
    setBoostDialogOpen(true);
  };

  const handleConfirmBoost = async () => {
    try {
      setBoosting(true);
      const creditsNeeded = Math.max(1, Math.ceil((boostHours || 24) / 24));
      const useCredits = (currentUser?.boostCredits || 0) >= creditsNeeded;
      await boostPropertyAPI(propertyId, useCredits, boostHours);
      
      // Fetch updated property data from server
      const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`);
      setProperty(response.data?.data || response.data || null);
      
      setBoostDialogOpen(false);
      toast.success(`Đã đẩy tin thành công thêm ${boostHours} giờ!`);
    } catch (error) {
      console.error('Boost error:', error);
      if (error.response?.status === 402) {
        toast.error('Số dư không đủ. Vui lòng nạp tiền hoặc mua gói boost credits.');
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi đẩy tin');
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
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      </ContentLayout>
    );
  }

  if (!property) {
    return (
      <ContentLayout title="Property Details">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-muted-foreground">Không tìm thấy tin đăng</div>
          <Button onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Chi tiết tin đăng">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-muted rounded-t-lg overflow-hidden">
                  {property.media?.find(m => m.type === 'image') ? (
                    <img
                      src={property.media.find(m => m.type === 'image').url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Badge className="bg-white/90 text-foreground">
                        {property.purpose === 'sale' ? 'Bán' : 'Cho thuê'}
                      </Badge>
                      {property.postType === 'vip' && (
                        <Badge className="bg-orange-500">VIP</Badge>
                      )}
                    </div>
                    
                    {/* Boost Status Badge with Remaining Time */}
                    {property.bumpedAt && property.boostExpiresAt && new Date(property.boostExpiresAt) > new Date() && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg animate-pulse">
                        <Zap className="h-3 w-3 mr-1" />
                        Boost còn: {getTimeRemaining(property.boostExpiresAt)}
                      </Badge>
                    )}
                    {property.bumpedAt && (!property.boostExpiresAt || new Date(property.boostExpiresAt) <= new Date()) && (
                      <Badge className="bg-gray-500">
                        <Zap className="h-3 w-3 mr-1" />
                        Boost đã hết hạn
                      </Badge>
                    )}
                  </div>

                  {/* Status */}
                  <div className="absolute top-4 right-4">
                    <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                      {property.status === 'active' ? 'Đang hoạt động' : property.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{property.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  {property.address?.fullAddress}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(property.price?.value, property.price?.currency)}
                  </span>
                  {property.price?.period && property.price.period !== 'other' && (
                    <span className="text-muted-foreground">/ {property.price.period === 'month' ? 'tháng' : 'năm'}</span>
                  )}
                </div>

                <Separator />

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.area} m²</div>
                      <div className="text-xs text-muted-foreground">Diện tích</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.rooms?.bedrooms || 0}</div>
                      <div className="text-xs text-muted-foreground">Phòng ngủ</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{property.rooms?.bathrooms || 0}</div>
                      <div className="text-xs text-muted-foreground">Phòng tắm</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium capitalize">{property.type}</div>
                      <div className="text-xs text-muted-foreground">Loại hình</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Boost & Stats (Only for Owner) */}
          {isOwner && (
            <div className="space-y-6">
              {/* Boost Card */}
              {property.status === 'active' && (
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <Zap className="h-5 w-5" />
                      Đẩy tin lên top
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Tăng khả năng hiển thị của tin đăng
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Boost Status Highlight */}
                    {property.boostExpiresAt && new Date(property.boostExpiresAt) > new Date() ? (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-semibold text-green-700">Boost đang hoạt động</span>
                          </div>
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700">Thời gian còn lại:</span>
                            <span className="font-bold text-lg text-green-600">
                              {getTimeRemaining(property.boostExpiresAt)}
                            </span>
                          </div>
                          
                          {/* Visual Progress Bar */}
                          {(() => {
                            const now = new Date();
                            const start = new Date(property.bumpedAt || property.createdAt);
                            const end = new Date(property.boostExpiresAt);
                            const total = end - start;
                            const elapsed = now - start;
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
                                  {Math.round(percent)}% thời gian còn lại
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Tin của bạn đang được ưu tiên hiển thị
                        </div>
                      </div>
                    ) : property.bumpedAt ? (
                      <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-gray-400 rounded-full" />
                            <span className="font-semibold text-gray-600">Boost đã hết hạn</span>
                          </div>
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Đẩy lần cuối: {getTimeSinceBoost(property.bumpedAt)}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold text-orange-700">Chưa từng đẩy tin</span>
                        </div>
                        <div className="text-sm text-orange-600 mt-2">
                          Đẩy tin để tăng khả năng hiển thị!
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Tổng số lần đã đẩy:</span>
                      <span className="font-medium">{property.bumpCount || 0} lần</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Chi phí đẩy tin:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {(currentUser?.boostCredits || 0) >= Math.max(1, Math.ceil((boostHours || 24)/24)) ? (
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {Math.max(1, Math.ceil((boostHours || 24)/24))} credits
                            </span>
                          ) : (
                            formatPrice(getBoostPrice(), 'VND')
                          )}
                        </span>
                      </div>
                      
                      {(currentUser?.boostCredits || 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Bạn còn {currentUser.boostCredits} credits
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="lg"
                      onClick={handleBoostClick}
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Đẩy tin ngay
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Tin của bạn sẽ xuất hiện ở vị trí đầu tiên trong kết quả tìm kiếm
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thống kê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Lượt xem
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      Lượt thích
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      Lượt chia sẻ
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Ngày đăng
                    </div>
                    <span className="text-sm">
                      {new Date(property.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {property.expireAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Hết hạn
                      </div>
                      <span className="text-sm">
                        {new Date(property.expireAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Phí đăng tin
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(property.listingFee || 0, 'VND')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hành động nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Xem trên trang chủ
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Chia sẻ tin đăng
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Xem báo cáo chi tiết
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Boost Confirmation Dialog */}
      <AlertDialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Xác nhận đẩy tin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <p className="text-foreground">
                  {isBoostActive() 
                    ? `Tin này đang được boost. Chọn thời gian để đẩy thêm:`
                    : `Bạn có chắc chắn muốn đẩy tin lên top không?`}
                </p>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tin đăng:</span>
                    <span className="font-medium truncate ml-2">{property.title}</span>
                  </div>
                  
                  {property.bumpedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Đẩy lần cuối:</span>
                      <span className="font-medium">{getTimeSinceBoost(property.bumpedAt)}</span>
                    </div>
                  )}
                  
                  {isBoostActive() && (
                    <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span className="text-green-700">Thời gian còn lại:</span>
                      <span className="font-semibold text-green-600">{getTimeRemaining(property.boostExpiresAt)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Chọn thời lượng {isBoostActive() ? 'cộng thêm' : 'boost'}:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[24, 48, 72].map(h => (
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
                          {!(currentUser?.boostCredits >= Math.max(1, Math.ceil(h/24))) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatPrice(getBoostPrice(h), 'VND')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isBoostActive() && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <span className="font-medium">ℹ️ Tổng thời gian sau khi đẩy:</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {getNewTotalTime()}
                      </div>
                      <div className="text-xs text-blue-600">
                        ({getRemainingHours()}h còn lại + {boostHours}h mới = {getRemainingHours() + boostHours}h)
                      </div>
                    </div>
                  )}

                  {(currentUser?.boostCredits || 0) >= Math.max(1, Math.ceil((boostHours || 24)/24)) ? (
                    <div className="bg-purple-50 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Sử dụng:</span>
                        <span className="font-semibold text-purple-600">{Math.max(1, Math.ceil((boostHours || 24)/24))} Boost Credits</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Credits còn lại:</span>
                        <span>{currentUser.boostCredits - Math.max(1, Math.ceil((boostHours || 24)/24))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">Phí đẩy tin ({boostHours}h):</div>
                          {boostHours > 24 && (
                            <div className="text-xs text-green-600 mt-1">
                              Tiết kiệm {Math.round(((getBoostPrice(24) * (boostHours/24)) - getBoostPrice(boostHours)) / 1000)}k!
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg text-orange-600">
                          {formatPrice(getBoostPrice(boostHours), 'VND')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>✨ {isBoostActive() ? 'Sau khi đẩy thêm' : 'Tin của bạn sẽ'}:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Xuất hiện ở vị trí đầu tiên</li>
                    <li>Được ưu tiên hiển thị</li>
                    <li>Tăng cơ hội được người mua xem</li>
                    {isBoostActive() 
                      ? <li className="font-medium text-blue-600">Thời gian sẽ được cộng thêm {boostHours}h</li>
                      : <li>Hiệu lực trong {boostHours} giờ</li>
                    }
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={boosting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBoost}
              disabled={boosting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {boosting ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Đang đẩy tin...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {isBoostActive() ? `Đẩy thêm ${boostHours}h` : `Xác nhận đẩy ${boostHours}h`}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
}
