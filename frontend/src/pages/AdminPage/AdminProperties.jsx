import { useEffect, useState } from "react";
import { getAdminPropertiesAPI, updatePropertyStatusAPI, deletePropertyAPI } from "@/apis/adminAPI";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, Trash2, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    order: "desc"
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, propertyId: null });

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
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
    } catch (error) {
      toast.error("Failed to delete property");
      console.error(error);
    }
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties Management</h1>
        <p className="text-muted-foreground">Manage all property listings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Properties</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              <Select value={filters.status || "all"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
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
                              {property.media && property.media[0] && (
                                <img
                                  src={property.media[0].url}
                                  alt={property.title}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <Link 
                                  to={`/properties/${property._id}`}
                                  className="font-medium hover:underline line-clamp-1"
                                >
                                  {property.title}
                                </Link>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {property.address?.fullAddress}
                                </p>
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
                                <p className="text-xs text-muted-foreground">
                                  {property.owner?.role}
                                </p>
                              </div>
                            </div>
                          </TableCell>
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
                        <TableCell colSpan={6} className="text-center py-8">
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
