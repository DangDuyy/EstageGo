import { useEffect, useState } from "react";
import { getDashboardStatsAPI } from "@/apis/adminAPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, UserCheck, Clock, CheckCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentAgentRequests, setRecentAgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStatsAPI();
      setStats(data.stats);
      setRecentProperties(data.recentProperties);
      setRecentAgentRequests(data.recentAgentRequests);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Active users",
      color: "text-blue-600"
    },
    {
      title: "Total Agents",
      value: stats?.totalAgents || 0,
      icon: UserCheck,
      description: "Verified agents",
      color: "text-green-600"
    },
    {
      title: "Total Properties",
      value: stats?.totalProperties || 0,
      icon: Home,
      description: "Listed properties",
      color: "text-purple-600"
    },
    {
      title: "Pending Requests",
      value: stats?.pendingAgentRequests || 0,
      icon: Clock,
      description: "Agent requests",
      color: "text-orange-600"
    },
    {
      title: "Active Properties",
      value: stats?.activeProperties || 0,
      icon: CheckCircle,
      description: "Currently active",
      color: "text-green-500"
    },
    {
      title: "Sold Properties",
      value: stats?.soldProperties || 0,
      icon: DollarSign,
      description: "Successfully sold",
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to EstageGo admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
            <CardDescription>Latest property listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.length > 0 ? (
                recentProperties.map((property) => (
                  <div key={property._id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <Link 
                        to={`/properties/${property._id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {property.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        By {property.owner?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(property.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        property.status === 'active' ? 'bg-green-100 text-green-700' :
                        property.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent properties</p>
              )}
              <Link 
                to="/admin/properties" 
                className="block text-sm text-blue-600 hover:underline mt-4"
              >
                View all properties →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Agent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Agent Requests</CardTitle>
            <CardDescription>Pending approval requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAgentRequests.length > 0 ? (
                recentAgentRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <img 
                        src={request.userId?.avatar || '/default-avatar.png'} 
                        alt={request.userId?.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{request.userId?.fullName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{request.userId?.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              )}
              <Link 
                to="/admin/agent-requests" 
                className="block text-sm text-blue-600 hover:underline mt-4"
              >
                View all requests →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
