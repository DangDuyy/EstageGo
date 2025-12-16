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

  const getBoostPrice = () => {
    const membership = currentUser?.membershipLevel || 'basic';
    if (membership === 'premium') return 50000;
    if (membership === 'standard') return 75000;
    return 100000;
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

  const handleBoostClick = () => {
    setBoostDialogOpen(true);
  };

  const handleConfirmBoost = async () => {
    try {
      setBoosting(true);
      const creditsNeeded = Math.max(1, Math.ceil((boostHours || 24) / 24));
      const useCredits = (currentUser?.boostCredits || 0) >= creditsNeeded;
      await boostPropertyAPI(propertyId, useCredits, boostHours);
      
      setBoostDialogOpen(false);
      
      // Reload property data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Boost error:', error);
      if (error.response?.status === 402) {
        toast.error('Số dư không đủ. Vui lòng nạp tiền hoặc mua gói boost credits.');
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
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/90 text-foreground">
                      {property.purpose === 'sale' ? 'Bán' : 'Cho thuê'}
                    </Badge>
                    {property.postType === 'vip' && (
                      <Badge className="bg-orange-500">VIP</Badge>
                    )}
                    {property.bumpedAt && (
                      <Badge className="bg-green-500">
                        <Zap className="h-3 w-3 mr-1" />
                        Đã đẩy
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
                    {property.bumpedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Đẩy lần cuối:</span>
                        <span className="font-medium">{getTimeSinceBoost(property.bumpedAt)}</span>
                      </div>
                    )}
                    {property.boostExpiresAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Hiệu lực boost còn:</span>
                        <span className="font-medium">{getTimeRemaining(property.boostExpiresAt)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Số lần đã đẩy:</span>
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
                  Bạn có chắc chắn muốn đẩy tin <strong>{property.title}</strong> lên top không?
                </p>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tin đăng:</span>
                    <span className="font-medium">{property.title}</span>
                  </div>
                  
                  {property.bumpedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Đẩy lần cuối:</span>
                      <span className="font-medium">{getTimeSinceBoost(property.bumpedAt)}</span>
                    </div>
                  )}
                  {property.boostExpiresAt && (
                    <div className="flex justify-between text-sm">
                      <span>Hiệu lực còn:</span>
                      <span className="font-medium">{getTimeRemaining(property.boostExpiresAt)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Chọn thời lượng boost</div>
                    <div className="flex gap-2">
                      {[24, 48, 72].map(h => (
                        <Button key={h} variant={boostHours === h ? 'default' : 'outline'} size="sm" onClick={() => setBoostHours(h)}>
                          {h} giờ
                        </Button>
                      ))}
                    </div>
                  </div>

                  {(currentUser?.boostCredits || 0) >= Math.max(1, Math.ceil((boostHours || 24)/24)) ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Sử dụng:</span>
                        <span className="font-semibold text-orange-600">{Math.max(1, Math.ceil((boostHours || 24)/24))} Boost Credits</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Credits còn lại:</span>
                        <span>{currentUser.boostCredits - Math.max(1, Math.ceil((boostHours || 24)/24))}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Chi phí:</span>
                      <span className="font-semibold text-orange-600">
                        {(() => {
                          const base = getBoostPrice();
                          const h = boostHours || 24;
                          const mult = h <= 24 ? 1 : (h <= 48 ? 1.5 : 2);
                          return formatPrice(Math.round(base * mult), 'VND');
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>✨ Tin của bạn sẽ:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Xuất hiện ở vị trí đầu tiên</li>
                    <li>Được ưu tiên hiển thị</li>
                    <li>Tăng cơ hội được người mua xem</li>
                    <li>Hiệu lực trong {boostHours} giờ</li>
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
                  Xác nhận đẩy tin
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
}
