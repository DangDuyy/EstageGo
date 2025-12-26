import { useEffect, useState } from "react";
import { getDashboardStatsAPI } from "@/apis/adminAPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Home, UserCheck, Clock, CheckCircle, DollarSign, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentAgentRequests, setRecentAgentRequests] = useState([]);
  const [topViewedProperties, setTopViewedProperties] = useState([]);
  const [topWishlistedProperties, setTopWishlistedProperties] = useState([]);
  const [topAgentsByRating, setTopAgentsByRating] = useState([]);
  const [topSearchedKeywords, setTopSearchedKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });

  // Chart data
  const [userTrendData, setUserTrendData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [userTypeData, setUserTypeData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });

  const handlePresetDate = (days) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    setDateRange({ startDate, endDate });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };
      const data = await getDashboardStatsAPI(params);

      setStats(data.stats || {});
      setRecentProperties(data.recentProperties || []);
      setRecentAgentRequests(data.recentAgentRequests || []);
      setTopViewedProperties(data.topViewedProperties || []);
      setTopWishlistedProperties(data.topWishlistedProperties || []);
      setTopAgentsByRating(data.topAgentsByRating || []);
      setTopSearchedKeywords(data.topSearchedKeywords || []);

      // Use ONLY real API data, no fallback to mocks
      setUserTrendData(data.userTrendData || []);
      setRevenueData(data.revenueData || []);
      setUserTypeData(data.userTypeData || []);
      setPropertyTypeData(data.propertyTypeData || []);
    } catch (error) {
      toast.error("Failed to load dashboard data - Please ensure backend is running");
      console.error(error);

      // Clear all data on error - no mock fallback
      setStats({});
      setRecentProperties([]);
      setRecentAgentRequests([]);
      setTopViewedProperties([]);
      setTopWishlistedProperties([]);
      setTopAgentsByRating([]);
      setTopSearchedKeywords([]);
      setUserTrendData([]);
      setRevenueData([]);
      setUserTypeData([]);
      setPropertyTypeData([]);
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
      title: "Total Revenue",
      value: currencyFormatter.format(stats?.totalRevenue || 0),
      icon: DollarSign,
      description: "Generated income",
      color: "text-yellow-600"
    }
  ];

  const userTrendSeries = [
    {
      id: 'New Users',
      color: '#3B82F6',
      data: userTrendData.map((item) => ({ x: item.date, y: item.users || 0 }))
    },
    {
      id: 'New Listings',
      color: '#F59E0B',
      data: userTrendData.map((item) => ({ x: item.date, y: item.listings || 0 }))
    },
    {
      id: 'New Requests',
      color: '#10B981',
      data: userTrendData.map((item) => ({ x: item.date, y: item.requests || 0 }))
    }
  ];

  const userTypePieData = userTypeData.map((item, index) => ({
    id: item.name || `User Type ${index}`,
    label: item.name || `User Type ${index}`,
    value: item.value || 0,
    color: COLORS[index % COLORS.length]
  }));

  const propertyTypeBarData = propertyTypeData;
  const revenueBarData = revenueData;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to EstageGo Admin Panel</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePresetDate(7)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetDate(30)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetDate(60)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Last 60 Days
            </button>
            <button
              onClick={() => handlePresetDate(90)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Last 90 Days
            </button>
          </div>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium block mb-1">From</label>
              <input
                type="date"
                value={format(dateRange.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({ ...dateRange, startDate: new Date(e.target.value) })}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">To</label>
              <input
                type="date"
                value={format(dateRange.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({ ...dateRange, endDate: new Date(e.target.value) })}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Container */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Stats</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview with Charts */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition hover:border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* User Trend Chart - takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>New users, listings, and requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveLine
                    data={userTrendSeries}
                    margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
                    axisBottom={{
                      tickRotation: -45,
                      legend: 'Date',
                      legendOffset: 40,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      legend: 'Count',
                      legendOffset: -40,
                      legendPosition: 'middle'
                    }}
                    colors={(series) => series.color}
                    pointSize={6}
                    pointBorderWidth={2}
                    useMesh
                    enableArea
                    areaOpacity={0.15}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        translateY: 50,
                        itemWidth: 140,
                        itemHeight: 14,
                        symbolSize: 10
                      }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>By user type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsivePie
                    data={userTypePieData}
                    margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
                    innerRadius={0.45}
                    padAngle={1}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={(series) => series.data.color}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#111827"
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        translateY: 36,
                        itemWidth: 120,
                        itemHeight: 14,
                        symbolSize: 10
                      }
                    ]}
                    tooltip={({ datum }) => (
                      <div className="rounded border bg-white px-2 py-1 text-sm shadow">
                        <div className="font-medium">{datum.label}</div>
                        <div>{datum.value.toLocaleString()}</div>
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue in VND</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveBar
                  data={revenueBarData}
                  keys={["revenue"]}
                  indexBy="date"
                  margin={{ top: 10, right: 20, bottom: 60, left: 70 }}
                  padding={0.3}
                  colors="#10B981"
                  axisBottom={{
                    tickRotation: -45,
                    legend: 'Date',
                    legendPosition: 'middle',
                    legendOffset: 48
                  }}
                  axisLeft={{
                    legend: 'Revenue (VND)',
                    legendPosition: 'middle',
                    legendOffset: -60
                  }}
                  valueFormat={(value) => currencyFormatter.format(value)}
                  tooltip={({ value, indexValue }) => (
                    <div className="rounded border bg-white px-2 py-1 text-sm shadow">
                      <div className="font-medium">{indexValue}</div>
                      <div>{currencyFormatter.format(value)}</div>
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Property Types</CardTitle>
              <CardDescription>Most listed property categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveBar
                  data={propertyTypeBarData}
                  keys={["value"]}
                  indexBy="name"
                  layout="horizontal"
                  margin={{ top: 10, right: 20, bottom: 40, left: 150 }}
                  padding={0.3}
                  colors={(bar) => COLORS[bar.indexValue.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % COLORS.length]}
                  enableGridY={false}
                  axisBottom={{
                    legend: 'Count',
                    legendPosition: 'middle',
                    legendOffset: 32
                  }}
                  axisLeft={{ tickPadding: 8 }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  valueFormat={(value) => value}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Detailed Statistics */}
        <TabsContent value="details" className="space-y-6">
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
                      <div key={property._id} className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 transition p-1 rounded">
                        <div className="flex-1">
                          <Link 
                            to={`/properties/${property._id}`}
                            className="font-medium hover:underline line-clamp-1 text-sm"
                          >
                            {property.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            By {property.owner?.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(property.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                          property.status === 'active' ? 'bg-green-100 text-green-700' :
                          property.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent properties</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Agent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Requests</CardTitle>
                <CardDescription>Pending approval requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAgentRequests.length > 0 ? (
                    recentAgentRequests.map((request) => (
                      <div key={request._id} className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 transition p-1 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <img 
                            src={request.userId?.avatar || '/default-avatar.png'} 
                            alt={request.userId?.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{request.userId?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{request.userId?.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                          request.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          request.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Viewed Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Top Viewed Properties
              </CardTitle>
              <CardDescription>Most viewed listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topViewedProperties.length > 0 ? (
                  topViewedProperties.map((prop, idx) => (
                    <div key={prop._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                      <div className="flex-1">
                        <p className="font-medium text-sm">#{idx + 1} {prop.title}</p>
                        <p className="text-xs text-muted-foreground">By {prop.owner?.fullName}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-blue-600">{(prop.viewCount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No view data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Wishlisted Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-pink-600" />
                Most Wishlisted Properties
              </CardTitle>
              <CardDescription>Properties added to wishlists most often</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topWishlistedProperties.length > 0 ? (
                  topWishlistedProperties.map((prop, idx) => (
                    <div key={prop._id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition">
                      <div className="flex-1">
                        <p className="font-medium text-sm">#{idx + 1} {prop.title}</p>
                        <p className="text-xs text-muted-foreground">{currencyFormatter.format(prop.price?.value || 0)}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-pink-600">{(prop.count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">saved</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No wishlist data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Agents by Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Top Rated Agents
              </CardTitle>
              <CardDescription>Agents with highest average ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAgentsByRating.length > 0 ? (
                  topAgentsByRating.map((agent, idx) => (
                    <div key={agent._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                      <div className="flex items-center gap-3 flex-1">
                        <img 
                          src={agent.avatar || '/default-avatar.png'} 
                          alt={agent.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">#{idx + 1} {agent.fullName}</p>
                          <p className="text-xs text-muted-foreground">{agent.reviewCount} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <p className="font-semibold text-sm text-yellow-700">{agent.avgRating?.toFixed(1)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No rating data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Searched Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Top Searched Keywords
              </CardTitle>
              <CardDescription>Most frequently searched terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSearchedKeywords.length > 0 ? (
                  topSearchedKeywords.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                      <div className="flex-1">
                        <p className="font-medium text-sm">#{idx + 1} {item.keyword || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">Search queries</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-purple-600">{(item.count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">times</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No search data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
