import { useEffect, useState } from "react";
import { 
  getAdminPropertiesAPI, 
  updatePropertyStatusAPI, 
  deletePropertyAPI,
  getPropertyStatsAPI 
} from "@/apis/adminAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, Trash2, Search, Home, Building2, TrendingUp, MapPin, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { getFirstImageUrl } from '@/utils/helper';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    purpose: "",
    postType: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    order: "desc"
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, propertyId: null });
  const [showFilters, setShowFilters] = useState(false);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalPropertyTypes: 0,
    topViewedProperties: [],
    propertiesByCity: []
  });

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getPropertyStatsAPI();
      setStats(data);
    } catch (error) {
      toast.error("Failed to load statistics");
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      const data = await getAdminPropertiesAPI(params);
      setProperties(data.properties);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load properties");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      await updatePropertyStatusAPI(propertyId, newStatus);
      toast.success("Property status updated");
      fetchProperties();
    } catch (error) {
      toast.error("Failed to update property status");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePropertyAPI(deleteDialog.propertyId);
      toast.success("Property deleted successfully");
      setDeleteDialog({ open: false, propertyId: null });
      fetchProperties();
      fetchStats(); // Refresh stats after delete
    } catch (error) {
      toast.error("Failed to delete property");
      console.error(error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      type: "",
      purpose: "",
      postType: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      order: "desc"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.status || filters.type || filters.purpose || filters.postType || filters.minPrice || filters.maxPrice;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties Management</h1>
        <p className="text-muted-foreground">Manage all property listings and view statistics</p>
      </div>

      <Tabs defaultValue="statistics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="properties">Properties List</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">All properties in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Property Types</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalPropertyTypes}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Different property types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Viewed</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">
                    {stats.topViewedProperties[0]?.viewCount?.toLocaleString() || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Highest view count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cities</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.propertiesByCity.length}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Different cities</p>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Most Viewed Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Viewed Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.topViewedProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topViewedProperties.map((property, index) => (
                        <TableRow key={property._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {property.media && Array.isArray(property.media) && property.media.length > 0 && (
                                <img
                                  src={getFirstImageUrl(property.media)}
                                  alt={property.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <Link 
                                to={`/properties/${property._id}`}
                                className="font-medium hover:underline line-clamp-1 max-w-xs"
                              >
                                {property.title}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {property.owner?.avatar && (
                                <img
                                  src={property.owner.avatar}
                                  alt={property.owner.fullName}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <span className="text-sm">{property.owner?.fullName || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{property.type}</TableCell>
                          <TableCell className="text-sm">
                            {property.address?.province || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {property.price?.value?.toLocaleString()} {property.price?.currency}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <div className="flex items-center justify-end gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              {property.viewCount.toLocaleString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No view data available</p>
              )}
            </CardContent>
          </Card>

          {/* Properties by City Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Properties Distribution by City</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.propertiesByCity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.propertiesByCity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="city" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Properties" fill="#8884d8">
                      {stats.propertiesByCity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No city data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties List Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <CardTitle>All Properties</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search properties..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button
                      variant={showFilters ? "default" : "outline"}
                      size="default"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-black rounded-full">
                          {[filters.status, filters.type, filters.purpose, filters.postType, filters.minPrice, filters.maxPrice].filter(Boolean).length}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Advanced Filters
                      </h3>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <Select 
                          value={filters.status || "all"} 
                          onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="status-filter">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="type-filter">Property Type</Label>
                        <Select 
                          value={filters.type || "all"} 
                          onValueChange={(value) => handleFilterChange('type', value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="type-filter">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Purpose Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="purpose-filter">Purpose</Label>
                        <Select 
                          value={filters.purpose || "all"} 
                          onValueChange={(value) => handleFilterChange('purpose', value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="purpose-filter">
                            <SelectValue placeholder="All Purposes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Purposes</SelectItem>
                            <SelectItem value="sale">For Sale</SelectItem>
                            <SelectItem value="rent">For Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Post Type Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="postType-filter">Post Type</Label>
                        <Select 
                          value={filters.postType || "all"} 
                          onValueChange={(value) => handleFilterChange('postType', value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="postType-filter">
                            <SelectValue placeholder="All Post Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Post Types</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Min Price Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="minPrice-filter">Min Price</Label>
                        <Input
                          id="minPrice-filter"
                          type="number"
                          placeholder="Min price..."
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        />
                      </div>

                      {/* Max Price Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice-filter">Max Price</Label>
                        <Input
                          id="maxPrice-filter"
                          type="number"
                          placeholder="Max price..."
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        />
                      </div>

                      {/* Sort By */}
                      <div className="space-y-2">
                        <Label htmlFor="sortBy-filter">Sort By</Label>
                        <Select 
                          value={filters.sortBy} 
                          onValueChange={(value) => handleFilterChange('sortBy', value)}
                        >
                          <SelectTrigger id="sortBy-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Date Created</SelectItem>
                            <SelectItem value="price.value">Price</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="area">Area</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Order */}
                      <div className="space-y-2">
                        <Label htmlFor="order-filter">Order</Label>
                        <Select 
                          value={filters.order} 
                          onValueChange={(value) => handleFilterChange('order', value)}
                        >
                          <SelectTrigger id="order-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Descending</SelectItem>
                            <SelectItem value="asc">Ascending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Posted Date</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.length > 0 ? (
                          properties.map((property) => (
                            <TableRow key={property._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {property.media && property.media.find(m => m.type === 'image') && (
                                    <img
                                      src={property.media.find(m => m.type === 'image').url}
                                      alt={property.title}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="max-w-xs">
                                    <Link 
                                      to={`/properties/${property._id}`}
                                      className="font-medium hover:underline line-clamp-1"
                                    >
                                      {property.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {property.address?.fullAddress}
                                    </p>
                                    {property.postType === 'vip' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={property.owner?.avatar || '/default-avatar.png'}
                                    alt={property.owner?.fullName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {property.owner?.fullName || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {property.owner?.role}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{property.type}</TableCell>
                              <TableCell className="capitalize">{property.purpose}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(property.createdAt), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {property.price?.value?.toLocaleString()} {property.price?.currency}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={property.status}
                                  onValueChange={(value) => handleStatusChange(property._id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="hidden">Hidden</SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="rented">Rented</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <Link to={`/properties/${property._id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDialog({ open: true, propertyId: property._id })}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              No properties found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.pages}
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, propertyId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, propertyId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
