import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Edit, Home, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getListingTiers, getListingTierUsageStats, updateListingTierPricing, getListingTierProperties } from '@/apis';

export default function AdminListingTierConfig() {
  const [tiers, setTiers] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [editingDuration, setEditingDuration] = useState({ days: 30, price: 0 });
  const [saving, setSaving] = useState(false);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [propertyList, setPropertyList] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tiersResponse, statsResponse] = await Promise.all([
        getListingTiers(),
        getListingTierUsageStats()
      ]);

      // Enrich tiers with UI data
      const enrichedTiers = tiersResponse.map(enrichTierData);
      setTiers(enrichedTiers);
      setUsageStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to load listing tier configs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const enrichTierData = (tier) => {
    const enriched = { ...tier };
    
    if (tier.tierName === 'advanced') {
      enriched.title = 'Breakthrough Visibility & Leads';
      enriched.description = 'Premium solution for maximum visibility and performance';
      enriched.color = 'from-yellow-600/80 to-yellow-800/80';
      enriched.bgColor = 'bg-yellow-50';
      enriched.borderColor = 'border-yellow-300';
      enriched.textColor = 'text-yellow-700';
    } else if (tier.tierName === 'boosted') {
      enriched.title = 'Enhanced Exposure';
      enriched.description = 'Popular solution to accelerate performance at reasonable cost';
      enriched.color = 'from-slate-600/80 to-slate-800/80';
      enriched.bgColor = 'bg-slate-50';
      enriched.borderColor = 'border-slate-300';
      enriched.textColor = 'text-slate-700';
    } else if (tier.tierName === 'basic') {
      enriched.title = 'Sustained Presence';
      enriched.description = 'Basic solution to maintain exposure';
      enriched.color = 'from-gray-600/50 to-gray-800/60';
      enriched.bgColor = 'bg-gray-50';
      enriched.borderColor = 'border-gray-300';
      enriched.textColor = 'text-gray-700';
    }
    
    return enriched;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  const handleEditDuration = (tier, duration) => {
    setSelectedTier(tier);
    setEditingDuration(duration);
    setEditDialogOpen(true);
  };

  const handleSaveDuration = async () => {
    try {
      setSaving(true);
      await updateListingTierPricing(selectedTier.tierName, editingDuration);
      toast.success('Duration pricing updated successfully');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update pricing');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleViewProperties = async (tier) => {
    try {
      setLoadingProps(true);
      setSelectedTier(tier);
      const res = await getListingTierProperties(tier.tierName);
      setPropertyList(res.data || []);
      setPropertyDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load properties');
      console.error(error);
    } finally {
      setLoadingProps(false);
    }
  };

  const getStatsForTier = (tierName) => {
    return usageStats.find(s => s.tierName === tierName) || {
      activeListings: 0,
      totalListings: 0,
      expiredListings: 0
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
        <h1 className="text-3xl font-bold tracking-tight">Listing Tier Config Management</h1>
        <p className="text-muted-foreground">Manage pricing and view usage statistics for listing tiers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const stats = getStatsForTier(tier.tierName);
          
          return (
            <Card key={tier.tierName} className={`border-2 ${tier.borderColor}`}>
              {/* Header with gradient overlay */}
              <div className={`relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-90`}></div>
                <div className="relative p-6 text-white">
                  <div className="space-y-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      Priority: {tier.priority}
                    </Badge>
                    <h3 className="text-2xl font-bold">{tier.displayName.en}</h3>
                    <p className="text-sm text-white/90">{tier.title}</p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </div>
                    <div className="text-xl font-bold text-green-600">{stats.activeListings}</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Home className="h-3 w-3" />
                      Total
                    </div>
                    <div className="text-xl font-bold">{stats.totalListings}</div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      Expired
                    </div>
                    <div className="text-xl font-bold text-red-600">{stats.expiredListings}</div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewProperties(tier)}>
                  <Eye className="h-4 w-4 mr-2" /> View posts
                </Button>

                {/* Duration Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Duration Options</h4>
                  </div>
                  
                  {tier.durations?.map((duration, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {duration.days} Days
                        </div>
                        <div className="text-xl font-bold">
                          {formatPrice(duration.price)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDuration(tier, duration)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Features */}
                {tier.features?.featuredListing && (
                  <div className={`p-3 ${tier.bgColor} rounded-lg border ${tier.borderColor}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${tier.textColor}`} />
                      <span className="text-sm font-medium">Featured Listing</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Duration Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Duration Pricing</DialogTitle>
            <DialogDescription>
              Update pricing for {selectedTier?.displayName.en} - {editingDuration.days} days
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duration (Days)</Label>
              <Input
                type="number"
                value={editingDuration.days}
                onChange={(e) => setEditingDuration({ ...editingDuration, days: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Price (VND)</Label>
              <Input
                type="number"
                value={editingDuration.price}
                onChange={(e) => setEditingDuration({ ...editingDuration, price: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                {formatPrice(editingDuration.price)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveDuration} disabled={saving}>
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

      {/* Properties Dialog */}
      <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Listings in {selectedTier?.displayName?.en}</DialogTitle>
            <DialogDescription>Bài post đang gán tier này</DialogDescription>
          </DialogHeader>

          {loadingProps ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto space-y-3">
              {propertyList.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có bài post nào</p>
              )}
              {propertyList.map((p) => (
                <div key={p._id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {p.media?.[0]?.url ? (
                        <img src={p.media[0].url} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Link to={`/properties/${p._id}`} className="font-semibold hover:underline line-clamp-2" target="_blank" rel="noreferrer">
                        {p.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">Status: {p.status}</div>
                      <div className="text-sm text-muted-foreground">
                        Expire: {p.expireAt ? new Date(p.expireAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {p.owner && (
                    <div className="text-right text-sm text-muted-foreground flex-shrink-0">
                      <Link to={`/agents/${p.owner._id}`} className="font-medium hover:underline" target="_blank" rel="noreferrer">
                        {p.owner.fullName}
                      </Link>
                      <div>{p.owner.email}</div>
                      <div>{p.owner.phone}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPropertyDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
