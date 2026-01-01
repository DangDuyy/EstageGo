import { useEffect, useState } from "react";
import { 
  getAdminUsersAPI, 
  updateUserRoleAPI, 
  toggleUserStatusAPI,
  getUserStatsAPI 
} from "@/apis/adminAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
import { 
  Search, 
  UserX, 
  UserCheck, 
  Users, 
  UserCog, 
  ShieldCheck,
  Activity,
  Home as HomeIcon,
  TrendingUp,
  Filter,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
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
    role: "",
    sortBy: "createdAt",
    order: "desc"
  });
  const [roleDialog, setRoleDialog] = useState({ open: false, userId: null, currentRole: null });
  const [newRole, setNewRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRegularUsers: 0,
    totalAgents: 0,
    totalAdmins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    userRoleDistribution: [],
    userStatusDistribution: [],
    topAgentsByProperties: [],
    topUsersByActivity: [],
    usersByProvince: [],
    userGrowthData: [],
    recentUsers: []
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getUserStatsAPI();
      setStats(data);
    } catch (error) {
      toast.error("Failed to load statistics");
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
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
      fetchStats(); // Refresh stats
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
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error("Failed to toggle user status");
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
      role: "",
      sortBy: "createdAt",
      order: "desc"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.role;

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
        <p className="text-muted-foreground">Manage all users and view statistics</p>
      </div>

      <Tabs defaultValue="statistics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="users">Users List</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">All users in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalRegularUsers.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Standard user accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agents</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.totalAgents.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Agent accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : stats.userRoleDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.userRoleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.userRoleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* User Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : stats.userStatusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.userStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.userStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#0088FE" name="Users" />
                    <Line type="monotone" dataKey="agents" stroke="#00C49F" name="Agents" />
                    <Line type="monotone" dataKey="admins" stroke="#FF8042" name="Admins" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No growth data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Agents by Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Agents by Properties Listed</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.topAgentsByProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Properties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topAgentsByProperties.map((agent, index) => (
                        <TableRow key={agent._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {agent.avatar && (
                                <img
                                  src={agent.avatar}
                                  alt={agent.fullName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <span className="font-medium">{agent.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{agent.companyName || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{agent.email}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <div className="flex items-center justify-end gap-1">
                              <HomeIcon className="h-4 w-4 text-muted-foreground" />
                              {agent.propertyCount}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No agent data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Users by Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.topUsersByActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Activities</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topUsersByActivity.map((user, index) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {user.avatar && (
                                <img
                                  src={user.avatar}
                                  alt={user.fullName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              )}
                              <span className="font-medium">{user.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <div className="flex items-center justify-end gap-1">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              {user.activityCount.toLocaleString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No activity data available</p>
              )}
            </CardContent>
          </Card>

          {/* Users by Province Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Users Distribution by City (Top 15)</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats.usersByProvince.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.usersByProvince}>
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
                    <Bar dataKey="count" name="Users" fill="#8884d8">
                      {stats.usersByProvince.map((entry, index) => (
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

        {/* Users List Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <CardTitle>All Users</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
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
                          1
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
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
                      {/* Role Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="role-filter">Role</Label>
                        <Select 
                          value={filters.role || "all"} 
                          onValueChange={(value) => handleFilterChange('role', value === "all" ? "" : value)}
                        >
                          <SelectTrigger id="role-filter">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="createdAt">Date Joined</SelectItem>
                            <SelectItem value="fullName">Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
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
        </TabsContent>
      </Tabs>

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
