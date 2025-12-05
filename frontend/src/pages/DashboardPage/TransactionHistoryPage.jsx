import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Filter, X, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getTransactionHistoryAPI } from '@/apis';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    transactionType: '', // 'credit' or 'debit' or ''
    type: '', // 'deposit', 'fee', 'refund', 'withdraw'
    status: '', // 'pending', 'completed', 'failed'
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactionHistoryAPI(pagination.page, pagination.limit, filters);
      
      if (response.success) {
        setTransactions(response.data);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const getTransactionTypeInfo = (type) => {
    const types = {
      deposit: { label: 'Deposit', icon: ArrowDownCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
      fee: { label: 'Fee', icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
      refund: { label: 'Refund', icon: ArrowDownCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      withdraw: { label: 'Withdraw', icon: ArrowUpCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' }
    };
    return types[type] || { label: type, icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
      cancelled: { label: 'Cancelled', variant: 'outline', icon: X }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      transactionType: '',
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
  };

  const exportTransactions = () => {
    // Simple CSV export
    const csvContent = [
      ['Transaction ID', 'Type', 'Amount', 'Status', 'Date'],
      ...transactions.map(t => [
        t.orderId,
        getTransactionTypeInfo(t.type).label,
        t.amount,
        t.status,
        formatDate(t.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 mt-2">Manage and track your transactions</p>
            </div>
            <Button onClick={exportTransactions} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Transaction Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Transaction Type</label>
                  <Select value={filters.transactionType} onValueChange={(value) => handleFilterChange('transactionType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="credit">Money In</SelectItem>
                      <SelectItem value="debit">Money Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Specific Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Transaction Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const typeInfo = getTransactionTypeInfo(transaction.type);
                      const Icon = typeInfo.icon;
                      const isCredit = ['deposit', 'refund'].includes(transaction.type);
                      
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.orderId}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${typeInfo.bgColor} w-fit`}>
                              <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                              <span className={`text-sm font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-xs">
                              {transaction.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                            {transaction.description || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                  </div>
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
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}