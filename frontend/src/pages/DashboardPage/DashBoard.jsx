import { useEffect, useState } from "react";
import { getAgentDashboardStatsAPI } from "@/apis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import {
  Home,
  Users,
  Star,
  UserCircle,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/user/userSlice";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const currentUser = useSelector(selectCurrentUser);
  const isAgent = currentUser?.role != "user";

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalViews: 0,
    followersCount: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAgent) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [currentUser, isAgent]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ✅ Chỉ gọi 1 API duy nhất
      const data = await getAgentDashboardStatsAPI();
      console.log("📊 Dashboard data:", data);

      const properties = data.properties || [];
      setAllProperties(properties);

      setStats({
        totalProperties: data.totalProperties || 0,
        totalViews: data.totalViews || 0,
        followersCount: data.followersCount || 0,
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
      });

      // Get recent 5 properties
      const recent = properties.slice(0, 5); // Already sorted by createdAt in backend

      setRecentProperties(recent);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("❌ Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const getPropertyTypeData = () => {
    const typeCount = {};
    allProperties.forEach((property) => {
      const type = property.type || "other";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = {
      apartment: "#3b82f6",
      house: "#10b981",
      villa: "#8b5cf6",
      townhouse: "#f59e0b",
      land: "#ef4444",
      commercial: "#06b6d4",
      office: "#ec4899",
      condo: "#14b8a6",
      other: "#6b7280",
    };

    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: colors[type] || "#6b7280",
    }));
  };

  const getLocationData = () => {
    const locationCount = {};
    allProperties.forEach((property) => {
      const province = property.address?.province || "Unknown";
      locationCount[province] = (locationCount[province] || 0) + 1;
    });

    return Object.entries(locationCount)
      .map(([province, count]) => ({
        province: province.length > 20 ? province.substring(0, 20) + "..." : province,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 provinces
  };

  if (loading) {
    return (
      <ContentLayout title="Dashboard">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ContentLayout>
    );
  }

  // If not an agent, show simple profile view
  if (!isAgent) {
    return (
      <ContentLayout title="Dashboard">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {currentUser?.fullName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                You are currently a regular user
              </p>
            </div>
          </div>

          {/* Single Action Card */}
          <div className="flex justify-center items-center min-h-[400px]">
            <Card className="w-full max-w-md hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Link to="/dashboard/account">
                <CardHeader className="text-center pb-8 pt-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-6 rounded-full bg-purple-50">
                      <UserCircle className="h-16 w-16 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-3">
                    View Your Profile
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your personal information and settings
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>
      </ContentLayout>
    );
  }

  // Agent dashboard
  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: Home,
      description: "All your listings",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      description: "Across all properties",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Followers",
      value: stats.followersCount,
      icon: Users,
      description: "People following you",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Average Rating",
      value: stats.averageRating ? stats.averageRating.toFixed(1) : "0.0",
      icon: Star,
      description: `${stats.totalReviews} reviews`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  const propertyTypeData = getPropertyTypeData();
  const locationData = getLocationData();

  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {currentUser?.fullName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your properties today
            </p>
          </div>
          <Link to="/dashboard/posts/new">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              <Home className="w-4 h-4" />
              New Property
            </button>
          </Link>
        </div>

        {/* Stats Grid - Now 4 cards in 2x2 grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        {allProperties.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Property Type Distribution Chart */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Property Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your listings by property type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={propertyTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Location Distribution Chart */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Properties by Location</CardTitle>
                <CardDescription>
                  Top provinces/cities with your listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="province"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link to="/dashboard/posts">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-blue-50">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Manage Properties
                  </CardTitle>
                  <CardDescription>View and edit your listings</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link to="/dashboard/account">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-purple-50">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">View Profile</CardTitle>
                  <CardDescription>Update your information</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link to={`/agents/${currentUser._id}`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-50">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Reviews & Stats</CardTitle>
                  <CardDescription>See your performance</CardDescription>
                </div>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Properties</CardTitle>
                <CardDescription>
                  Your latest property listings
                </CardDescription>
              </div>
              <Link
                to="/dashboard/posts"
                className="text-sm text-primary hover:underline font-medium"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.length > 0 ? (
                recentProperties.map((property) => (
                  <div
                    key={property._id}
                    className="flex items-center gap-4 border-b pb-4 last:border-0 hover:bg-muted/50 p-3 rounded-md transition-colors"
                  >
                    {/* Property Image */}
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {property.media?.find((m) => m.type === "image")?.url ? (
                        <img
                          src={
                            property.media.find((m) => m.type === "image").url
                          }
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/dashboard/posts/edit/${property._id}`}
                        className="font-medium hover:underline line-clamp-1 block text-foreground"
                      >
                        {property.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {property.address?.street}
                        {property.address?.ward && `, ${property.address.ward}`}
                        {property.address?.district &&
                          `, ${property.address.district}`}
                        {property.address?.province &&
                          `, ${property.address.province}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(property.createdAt), "MMM dd, yyyy")}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          •
                        </span>
                        <p className="text-xs text-muted-foreground capitalize">
                          {property.type} • {property.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Property Price & Status */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-primary text-lg">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: property.price?.currency || "VND",
                          maximumFractionDigits: 0,
                        }).format(property.price?.value || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {property.area} m²
                      </p>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full inline-block mt-2 font-medium ${
                          property.status === "active"
                            ? "bg-green-100 text-green-700"
                            : property.status === "draft"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {property.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Home className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    No properties yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first property listing
                  </p>
                  <Link to="/dashboard/posts/new">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Home className="w-4 h-4" />
                      Create Property
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
