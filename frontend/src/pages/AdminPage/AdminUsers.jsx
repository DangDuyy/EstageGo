import { useEffect, useState } from "react";
import { getAdminUsersAPI, updateUserRoleAPI, toggleUserStatusAPI } from "@/apis/adminAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, UserX, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    sortBy: "createdAt",
    order: "desc"
  });
  const [roleDialog, setRoleDialog] = useState({ open: false, userId: null, currentRole: null });
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const data = await getAdminUsersAPI(params);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      await updateUserRoleAPI(roleDialog.userId, newRole);
      toast.success("User role updated");
      setRoleDialog({ open: false, userId: null, currentRole: null });
      setNewRole("");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await toggleUserStatusAPI(userId);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to toggle user status");
      console.error(error);
    }
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleFilterChange = (value) => {
    setFilters(prev => ({ ...prev, role: value === "all" ? "" : value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: "bg-purple-100 text-purple-700",
      agent: "bg-blue-100 text-blue-700",
      user: "bg-gray-100 text-gray-700"
    };
    return (
      <Badge className={variants[role] || "bg-gray-100 text-gray-700"}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground">Manage all users and their roles</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              <Select value={filters.role || "all"} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="user">User</SelectItem>
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
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar || '/default-avatar.png'}
                                alt={user.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium">{user.fullName || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">@{user.userName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRoleDialog({ 
                                    open: true, 
                                    userId: user._id, 
                                    currentRole: user.role 
                                  });
                                  setNewRole(user.role);
                                }}
                              >
                                Change Role
                              </Button>
                              <Button
                                variant={user.isActive ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleStatus(user._id, user.isActive)}
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No users found
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

      {/* Change Role Dialog */}
      <Dialog 
        open={roleDialog.open} 
        onOpenChange={(open) => {
          setRoleDialog({ open, userId: null, currentRole: null });
          setNewRole("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for this user. This will affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRoleDialog({ open: false, userId: null, currentRole: null });
                setNewRole("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRole || newRole === roleDialog.currentRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
