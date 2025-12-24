import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Edit, Users, CheckCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMembershipConfigs, getMembershipConfigUsageStats, updateMembershipPricing, getMembershipUsers } from '@/apis';

export default function AdminMembershipConfig() {
  const [packages, setPackages] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editingPrice, setEditingPrice] = useState({ durationMonths: 1, price: 0, discount: 0 });
  const [saving, setSaving] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsResponse, statsResponse] = await Promise.all([
        getMembershipConfigs(),
        getMembershipConfigUsageStats()
      ]);

      // Enrich configs with UI data
      const enrichedConfigs = configsResponse.data.map(enrichPackageData);
      setPackages(enrichedConfigs);
      setUsageStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to load membership configs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const enrichPackageData = (pkg) => {
    const enriched = { ...pkg };
    
    if (pkg.membershipType === 'advanced') {
      enriched.badge = 'x5 Effectiveness';
      enriched.subtitle = 'compared to Basic Listing';
      enriched.bgGradient = 'from-yellow-500 via-yellow-200 to-amber-100';
      enriched.bgColor = 'bg-amber-50';
      enriched.accentColor = 'text-amber-700';
      enriched.borderColor = 'border-amber-200';
    } else if (pkg.membershipType === 'boosted') {
      enriched.badge = 'x2.5 Effectiveness';
      enriched.subtitle = 'compared to Basic Listing';
      enriched.bgGradient = 'from-blue-300 via-blue-100 to-indigo-100';
      enriched.bgColor = 'bg-blue-50';
      enriched.accentColor = 'text-blue-700';
      enriched.borderColor = 'border-blue-200';
    } else if (pkg.membershipType === 'basic') {
      enriched.badge = 'Standard Effectiveness';
      enriched.subtitle = 'stable';
      enriched.bgGradient = 'from-gray-500 via-gray-200 to-slate-100';
      enriched.bgColor = 'bg-gray-50';
      enriched.accentColor = 'text-gray-700';
      enriched.borderColor = 'border-gray-200';
    }
    
    return enriched;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleEditPrice = (pkg, pricingOption) => {
    setSelectedPackage(pkg);
    setEditingPrice(pricingOption);
    setEditDialogOpen(true);
  };

  const handleSavePrice = async () => {
    try {
      setSaving(true);
      await updateMembershipPricing(selectedPackage.membershipType, editingPrice);
      toast.success('Price updated successfully');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update price');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleViewUsers = async (pkg) => {
    try {
      setLoadingUsers(true);
      setSelectedPackage(pkg);
      const res = await getMembershipUsers(pkg.membershipType);
      setUserList(res.data || []);
      setUserDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getStatsForPackage = (membershipType) => {
    return usageStats.find(s => s.membershipType === membershipType) || {
      activeUsers: 0,
      totalUsers: 0,
      expiredUsers: 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Membership Config Management</h1>
        <p className="text-muted-foreground">Manage pricing and view usage statistics for membership packages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const stats = getStatsForPackage(pkg.membershipType);
          
          return (
            <Card key={pkg.membershipType} className={`border-2 ${pkg.borderColor}`}>
              {/* Header with gradient */}
              <div className={`bg-gradient-to-br ${pkg.bgGradient} p-6`}>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 font-medium">PACKAGE</div>
                  <h3 className="text-2xl font-bold">{pkg.displayName.en}</h3>
                  <div className={`inline-block ${pkg.bgColor} px-3 py-1 rounded-sm`}>
                    <span className={`text-sm font-bold ${pkg.accentColor}`}>
                      {pkg.badge}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{pkg.subtitle}</div>
                </div>
              </div>

              {/* Stats Section */}
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Active Users
                    </div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      Total Users
                    </div>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewUsers(pkg)}>
                  <Eye className="h-4 w-4 mr-2" /> View users
                </Button>

                {/* Pricing Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Pricing Options</h4>
                  </div>
                  
                  {pkg.pricing?.map((option, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {option.durationMonths} {option.durationMonths === 1 ? 'Month' : 'Months'}
                        </div>
                        <div className="text-2xl font-bold">
                          {formatPrice(option.price)}
                        </div>
                        {option.discount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            -{option.discount}% discount
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPrice(pkg, option)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Included Listings Info */}
                <div className={`p-3 ${pkg.bgColor} rounded-lg`}>
                  <div className="text-xs text-muted-foreground mb-1">Included Listings</div>
                  <div className="font-semibold">
                    {pkg.includedListings?.quantity} × {pkg.includedListings?.tier} tier
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pricing</DialogTitle>
            <DialogDescription>
              Update pricing for {selectedPackage?.displayName.en} - {editingPrice.durationMonths} month(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duration (Months)</Label>
              <Input
                type="number"
                value={editingPrice.durationMonths}
                onChange={(e) => setEditingPrice({ ...editingPrice, durationMonths: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Price (VND)</Label>
              <Input
                type="number"
                value={editingPrice.price}
                onChange={(e) => setEditingPrice({ ...editingPrice, price: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                {formatPrice(editingPrice.price)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editingPrice.discount}
                onChange={(e) => setEditingPrice({ ...editingPrice, discount: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Users in {selectedPackage?.displayName?.en}</DialogTitle>
            <DialogDescription>Danh sách user đã mua gói này</DialogDescription>
          </DialogHeader>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto space-y-3">
              {userList.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có user nào</p>
              )}
              {userList.map((user) => (
                <div key={user._id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No avatar</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Link to={`/agents/${user._id}`} className="font-semibold hover:underline" target="_blank" rel="noreferrer">
                        {user.fullName || 'No name'}
                      </Link>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.phone}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Start: {user.startDate ? new Date(user.startDate).toLocaleDateString() : '-'}</div>
                    <div>End: {user.endDate ? new Date(user.endDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
