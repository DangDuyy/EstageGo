import { useEffect, useState } from "react";
import { getTransactionStatsAPI } from "@/apis/adminAPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, CreditCard, Users, Calendar, CheckCircle, Eye, ChevronDown, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminTransactions() {
  const [stats, setStats] = useState(null);
  const [topSpenders, setTopSpenders] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState(10);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });

  // Chart data
  const [revenueByDateData, setRevenueByDateData] = useState([]);
  const [transactionByTypeData, setTransactionByTypeData] = useState([]);
  const [transactionByPaymentMethodData, setTransactionByPaymentMethodData] = useState([]);
  const [transactionByStatusData, setTransactionByStatusData] = useState([]);

  // User transactions dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  // Transaction filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    searchName: '',
    searchEmail: '',
    filterStartDate: '',
    filterEndDate: ''
  });

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
    fetchTransactionStats();
  }, [dateRange]);

  const fetchTransactionStats = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      };
      const data = await getTransactionStatsAPI(params);

      setStats(data.stats || {});
      setTopSpenders(data.topSpenders || []);
      setRecentTransactions(data.recentTransactions || []);
      setRevenueByDateData(data.revenueByDateData || []);
      setTransactionByTypeData(data.transactionByTypeData || []);
      setTransactionByPaymentMethodData(data.transactionByPaymentMethodData || []);
      setTransactionByStatusData(data.transactionByStatusData || []);
      setDisplayedTransactions(10); // Reset displayed count
    } catch (error) {
      toast.error("Failed to load transaction statistics");
      console.error(error);

      setStats({});
      setTopSpenders([]);
      setRecentTransactions([]);
      setRevenueByDateData([]);
      setTransactionByTypeData([]);
      setTransactionByPaymentMethodData([]);
      setTransactionByStatusData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    // Filter transactions for this user
    const userTxns = recentTransactions.filter(txn => txn.user?._id === user._id);
    setUserTransactions(userTxns);
    setUserDialogOpen(true);
  };

  const handleLoadMore = () => {
    setDisplayedTransactions(prev => Math.min(prev + 10, filteredTransactions.length));
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      status: '',
      searchName: '',
      searchEmail: '',
      filterStartDate: '',
      filterEndDate: ''
    });
    setDisplayedTransactions(10);
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "bg-green-100 text-green-700",
      pending: "bg-orange-100 text-orange-700",
      failed: "bg-red-100 text-red-700",
      cancelled: "bg-gray-100 text-gray-700"
    };
    return <Badge className={variants[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    const variants = {
      deposit: "bg-blue-100 text-blue-700",
      fee: "bg-purple-100 text-purple-700",
      refund: "bg-green-100 text-green-700",
      withdraw: "bg-orange-100 text-orange-700"
    };
    const labels = {
      deposit: "Deposit",
      fee: "Fee",
      refund: "Refund",
      withdraw: "Withdraw"
    };
    return <Badge className={variants[type] || "bg-gray-100 text-gray-700"}>{labels[type] || type}</Badge>;
  };

  // Filter transactions based on filters
  const filteredTransactions = recentTransactions.filter(txn => {
    // Filter by type
    if (filters.type && txn.type !== filters.type) return false;
    
    // Filter by status
    if (filters.status && txn.status !== filters.status) return false;
    
    // Filter by name
    if (filters.searchName && !txn.user?.fullName?.toLowerCase().includes(filters.searchName.toLowerCase())) return false;
    
    // Filter by email
    if (filters.searchEmail && !txn.user?.email?.toLowerCase().includes(filters.searchEmail.toLowerCase())) return false;
    
    // Filter by date range
    if (filters.filterStartDate || filters.filterEndDate) {
      const txnDate = new Date(txn.createdAt);
      const start = filters.filterStartDate ? new Date(filters.filterStartDate) : new Date('1970-01-01');
      const end = filters.filterEndDate ? new Date(filters.filterEndDate + 'T23:59:59') : new Date('2100-01-01');
      
      if (!isWithinInterval(txnDate, { start, end })) return false;
    }
    
    return true;
  });

  // Format data for charts
  const revenueLineData = [
    {
      id: "Revenue",
      color: "#10B981",
      data: revenueByDateData.map(item => ({
        x: format(new Date(item.date), 'MM/dd'),
        y: item.revenue
      }))
    }
  ];

  const transactionTypePieData = transactionByTypeData.map((item, index) => ({
    id: item.name,
    label: item.name,
    value: item.value,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
  }));

  const paymentMethodPieData = transactionByPaymentMethodData.map((item, index) => ({
    id: item.name,
    label: item.name,
    value: item.value,
    color: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][index % 5]
  }));

  const statusPieData = transactionByStatusData.map((item, index) => ({
    id: item.name,
    label: item.name,
    value: item.value,
    color: item.name === 'completed' ? '#10B981' : 
           item.name === 'pending' ? '#F59E0B' : 
           item.name === 'failed' ? '#EF4444' : '#6B7280'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: currencyFormatter.format(stats?.totalRevenue || 0),
      description: format(dateRange.endDate, 'yyyy-MM-dd'),
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Transactions",
      value: stats?.totalTransactions || 0,
      description: `Success Rate: ${stats?.successRate?.toFixed(1) || 0}%`,
      icon: CreditCard,
      color: "text-blue-600"
    },
    {
      title: "Completed Transactions",
      value: stats?.completedTransactions || 0,
      description: "SUCCESSFUL TRANSACTIONS",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Average",
      value: currencyFormatter.format(stats?.averageTransactionValue || 0),
      description: "COINS DEPOSITED",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
          <p className="text-muted-foreground">Track and analyze user coin deposit transactions</p>
        </div>
        <button
          onClick={fetchTransactionStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Time Range
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 justify-between">
          <div className="flex gap-2 flex-wrap">
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
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analytics">Analytics & Statistics</TabsTrigger>
          <TabsTrigger value="transactions">Transaction List</TabsTrigger>
        </TabsList>

        {/* Tab 1: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition hover:border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {revenueByDateData.length > 0 ? (
                  <ResponsiveLine
                    data={revenueLineData}
                    margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', stacked: false, min: 0, max: 'auto' }}
                    curve="cardinal"
                    axisBottom={{
                      tickRotation: -45,
                      legend: 'Date',
                      legendOffset: 45,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      legend: 'Revenue (VND)',
                      legendPosition: 'middle',
                      legendOffset: -70,
                      format: value => `${(value / 1000).toFixed(0)}K`
                    }}
                    colors="#10B981"
                    pointSize={8}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    enableArea={true}
                    areaOpacity={0.2}
                    tooltip={({ point }) => (
                      <div className="rounded border bg-white px-3 py-2 text-sm shadow-lg">
                        <div className="font-medium">{point.data.x}</div>
                        <div className="text-green-600 font-semibold">
                          {currencyFormatter.format(point.data.y)}
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Transaction Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>By Transaction Type</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {transactionByTypeData.length > 0 ? (
                    <ResponsivePie
                      data={transactionTypePieData}
                      margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                      innerRadius={0.5}
                      padAngle={2}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={(d) => d.data.color}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#111827"
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          translateY: 50,
                          itemWidth: 100,
                          itemHeight: 14,
                          symbolSize: 10
                        }
                      ]}
                      tooltip={({ datum }) => (
                        <div className="rounded border bg-white px-2 py-1 text-sm shadow">
                          <div className="font-medium">{datum.label}</div>
                          <div>{datum.value.toLocaleString()} transactions</div>
                        </div>
                      )}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>By Payment Method</CardTitle>
                <CardDescription>Distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {transactionByPaymentMethodData.length > 0 ? (
                    <ResponsivePie
                      data={paymentMethodPieData}
                      margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                      innerRadius={0.5}
                      padAngle={2}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={(d) => d.data.color}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#111827"
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          translateY: 50,
                          itemWidth: 80,
                          itemHeight: 14,
                          symbolSize: 10
                        }
                      ]}
                      tooltip={({ datum }) => (
                        <div className="rounded border bg-white px-2 py-1 text-sm shadow">
                          <div className="font-medium">{datum.label}</div>
                          <div>{datum.value.toLocaleString()} transactions</div>
                        </div>
                      )}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {transactionByStatusData.length > 0 ? (
                    <ResponsivePie
                      data={statusPieData}
                      margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                      innerRadius={0.5}
                      padAngle={2}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={(d) => d.data.color}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#ffffff"
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          translateY: 50,
                          itemWidth: 100,
                          itemHeight: 14,
                          symbolSize: 10
                        }
                      ]}
                      tooltip={({ datum }) => (
                        <div className="rounded border bg-white px-2 py-1 text-sm shadow">
                          <div className="font-medium">{datum.label}</div>
                          <div>{datum.value.toLocaleString()} transactions</div>
                          <div className="text-xs text-muted-foreground">
                            {((datum.value / stats.totalTransactions) * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Spenders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Top 10 Highest Spending Users
              </CardTitle>
              <CardDescription>List of users with highest total spending from {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left text-sm font-semibold">Rank</th>
                      <th className="p-3 text-left text-sm font-semibold">User</th>
                      <th className="p-3 text-left text-sm font-semibold">Total Spent</th>
                      <th className="p-3 text-left text-sm font-semibold">Transactions</th>
                      <th className="p-3 text-left text-sm font-semibold">Average</th>
                      <th className="p-3 text-left text-sm font-semibold">Last Transaction</th>
                      <th className="p-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSpenders.length > 0 ? (
                      topSpenders.map((user, idx) => (
                        <tr key={user._id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                              idx === 1 ? 'bg-gray-200 text-gray-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {idx + 1}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={user.avatar || '/default-avatar.png'} 
                                alt={user.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  user.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.role === 'agent' ? 'Recruiter' : 'Candidate'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-green-600 text-lg">
                              {currencyFormatter.format(user.totalSpent)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-blue-600">
                              {user.transactionCount}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-gray-700">
                              {currencyFormatter.format(user.averageSpent)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(user.lastTransaction), 'HH:mm:ss dd/MM/yyyy')}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserClick(user)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-muted-foreground">
                          No transaction data in this time period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Transaction List with Filters */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Transactions
                </CardTitle>
                {(filters.type || filters.status || filters.searchName || filters.searchEmail || filters.filterStartDate || filters.filterEndDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium block mb-2">Transaction Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({ ...filters, type: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="fee">Fee</option>
                    <option value="refund">Refund</option>
                    <option value="withdraw">Withdraw</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium block mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Name Search */}
                <div>
                  <label className="text-sm font-medium block mb-2">User Name</label>
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.searchName}
                    onChange={(e) => {
                      setFilters({ ...filters, searchName: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Email Search */}
                <div>
                  <label className="text-sm font-medium block mb-2">User Email</label>
                  <Input
                    type="text"
                    placeholder="Search by email..."
                    value={filters.searchEmail}
                    onChange={(e) => {
                      setFilters({ ...filters, searchEmail: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="text-sm font-medium block mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.filterStartDate}
                    onChange={(e) => {
                      setFilters({ ...filters, filterStartDate: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="text-sm font-medium block mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.filterEndDate}
                    onChange={(e) => {
                      setFilters({ ...filters, filterEndDate: e.target.value });
                      setDisplayedTransactions(10);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{Math.min(displayedTransactions, filteredTransactions.length)}</span> of <span className="font-semibold text-foreground">{filteredTransactions.length}</span> filtered transactions
                  {filteredTransactions.length !== recentTransactions.length && (
                    <span> (from {recentTransactions.length} total)</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.slice(0, displayedTransactions).map((transaction) => (
                  <div 
                    key={transaction._id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => transaction.user && handleUserClick(transaction.user)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <img 
                          src={transaction.user?.avatar || '/default-avatar.png'} 
                          alt={transaction.user?.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{transaction.user?.fullName || 'Unknown'}</p>
                            {getTypeBadge(transaction.type)}
                            {getStatusBadge(transaction.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{transaction.user?.email}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              ID: <span className="font-mono">{transaction.orderId}</span>
                            </span>
                            {transaction.paymentMethod && (
                              <span className="text-muted-foreground">
                                Method: <span className="font-medium">{transaction.paymentMethod.toUpperCase()}</span>
                              </span>
                            )}
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600 mb-1">
                          {currencyFormatter.format(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.createdAt), 'HH:mm:ss dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {displayedTransactions < filteredTransactions.length && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Load more ({filteredTransactions.length - displayedTransactions} transactions)
                  </Button>
                </div>
              )}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions match your filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Transactions Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[1600px] sm:!max-w-[1600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Transaction Details</DialogTitle>
            {selectedUser && (
              <DialogDescription>
                <div className="flex items-center gap-3 mt-2">
                  <img 
                    src={selectedUser.avatar || '/default-avatar.png'} 
                    alt={selectedUser.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-base text-foreground">{selectedUser.fullName}</p>
                    <p className="text-sm">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={selectedUser.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                        {selectedUser.role === 'agent' ? 'Recruiter' : 'Candidate'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currencyFormatter.format(selectedUser.totalSpent)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedUser.transactionCount}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {currencyFormatter.format(selectedUser.averageSpent)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold">Transaction History ({userTransactions.length})</h3>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {userTransactions.length > 0 ? (
                    userTransactions.map((txn) => (
                      <div key={txn._id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium">{txn.orderId}</span>
                              {getTypeBadge(txn.type)}
                              {getStatusBadge(txn.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Method: {txn.paymentMethod?.toUpperCase()}</span>
                              <span>{format(new Date(txn.createdAt), 'HH:mm:ss dd/MM/yyyy')}</span>
                            </div>
                            {txn.description && (
                              <p className="text-sm text-muted-foreground mt-1">{txn.description}</p>
                            )}
                            {txn.transactionNo && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Bank Transaction ID: {txn.transactionNo}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg text-green-600">
                              {currencyFormatter.format(txn.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No transactions
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}