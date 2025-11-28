import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wallet, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getBalanceAPI, createPaymentAPI } from '@/apis';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function DepositPage() {
  const navigate = useNavigate();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [bankCode, setBankCode] = useState('ALL_BANKS');
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Predefined amounts
  const predefinedAmounts = [
    { amount: 500000, label: '500.000 đ' },
    { amount: 1000000, label: '1.000.000 đ' },
    { amount: 2000000, label: '2.000.000 đ' },
    { amount: 3000000, label: '3.000.000 đ' },
    { amount: 5000000, label: '5.000.000 đ' },
    { amount: 10000000, label: '10.000.000 đ' }
  ];

  const banks = [
    { code: 'ALL_BANKS', name: 'Tất cả ngân hàng' },
    { code: 'VNBANK', name: 'Thẻ ATM/Internet Banking' },
    { code: 'INTCARD', name: 'Thẻ quốc tế (Visa/Master/JCB)' },
    { code: 'NCB', name: 'Ngân hàng NCB' },
    { code: 'VCB', name: 'Ngân hàng Vietcombank' },
    { code: 'TCB', name: 'Ngân hàng Techcombank' },
    { code: 'MB', name: 'Ngân hàng MB' },
    { code: 'VIB', name: 'Ngân hàng VIB' },
    { code: 'ICB', name: 'Ngân hàng VietinBank' },
    { code: 'ACB', name: 'Ngân hàng ACB' },
    { code: 'VPB', name: 'Ngân hàng VPBank' },
    { code: 'BIDV', name: 'Ngân hàng BIDV' },
    { code: 'SHB', name: 'Ngân hàng SHB' },
    { code: 'TPB', name: 'Ngân hàng TPBank' }
  ];

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance();
    // Load user info from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.userName || user.fullName || '');
    setUserEmail(user.email || '');
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await getBalanceAPI();
      if (response.success) {
        setCurrentBalance(response.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getSelectedAmountBonus = () => {
    const selected = predefinedAmounts.find(item => item.amount === parseInt(depositAmount));
    return selected?.bonus || 0;
  };

  const getTotalAmount = () => {
    const amount = parseInt(depositAmount) || 0;
    const bonus = getSelectedAmountBonus();
    return amount + bonus;
  };

  const handlePredefinedAmountClick = (amount) => {
    setDepositAmount(amount.toString());
  };

  const handleDeposit = async () => {
    try {
      // Validation
      if (!depositAmount || parseInt(depositAmount) < 10000) {
        toast.error('Số tiền nạp tối thiểu là 10.000 VND');
        return;
      }

      if (parseInt(depositAmount) > 500000000) {
        toast.error('Số tiền nạp tối đa là 500.000.000 VND');
        return;
      }

      // Nếu số tiền >= 2.000.000đ và chưa điền email thì yêu cầu
      if (parseInt(depositAmount) >= 2000000 && showInvoiceDetails && !userEmail) {
        toast.error('Vui lòng nhập email để nhận hóa đơn');
        return;
      }

      setLoading(true);
      
      // ✅ FIX: Convert ALL_BANKS về empty string
      const finalBankCode = bankCode === 'ALL_BANKS' ? '' : bankCode;
      const response = await createPaymentAPI(parseInt(depositAmount), finalBankCode);

      if (response.success && response.paymentUrl) {
        toast.success('Đang chuyển đến trang thanh toán VNPay...');
        // Redirect to VNPay
        window.location.href = response.paymentUrl;
      } else {
        toast.error('Không thể tạo URL thanh toán');
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nạp tiền vào tài khoản</h1>
          <p className="text-gray-600 mt-2">Chọn số tiền và phương thức thanh toán</p>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Số dư hiện tại</p>
                <p className="text-3xl font-bold">{formatCurrency(currentBalance)} đ</p>
              </div>
              <Wallet className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Thông tin nạp tiền
            </CardTitle>
            <CardDescription>
              Nạp tối thiểu 10.000đ để được nhận khuyến mãi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-medium">
                Nhập số tiền bạn muốn nạp (đ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nạp từ 10.000 đ"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={10000}
                max={500000000}
                className="text-lg py-6"
              />
              {depositAmount && (
                <p className="text-sm text-gray-600">
                  Số tiền: <span className="font-semibold">{formatCurrency(parseInt(depositAmount))} VND</span>
                </p>
              )}
            </div>

            {/* Predefined Amounts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Hoặc chọn nhanh</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {predefinedAmounts.map((item) => (
                  <Card
                    key={item.amount}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      depositAmount === item.amount.toString()
                        ? 'border-blue-500 border-2 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handlePredefinedAmountClick(item.amount)}
                  >
                    <CardContent className="p-4">
                      <p className="font-bold text-base">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-base font-medium">
                Chọn phương thức thanh toán
              </Label>
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger id="bank" className="text-base py-6">
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Invoice Details Toggle */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}
              >
                <span className="text-base font-medium">Xuất hóa đơn cho giao dịch</span>
                {showInvoiceDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>

              {showInvoiceDetails && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyerName">Họ tên người mua hàng</Label>
                      <Input
                        id="buyerName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email nhận hóa đơn</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Tên đơn vị (Tên công ty)</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nhập tên công ty (nếu có)"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            {depositAmount && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số tiền nạp:</span>
                  <span className="font-semibold">{formatCurrency(parseInt(depositAmount))} đ</span>
                </div>
                {getSelectedAmountBonus() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Khuyến mãi:</span>
                    <span className="font-semibold text-green-600">+{formatCurrency(getSelectedAmountBonus())} đ</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-bold">Tổng tiền nhận được:</span>
                  <span className="font-bold text-blue-600 text-xl">{formatCurrency(getTotalAmount())} đ</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm">
                <p className="text-gray-600">Hotline hỗ trợ:</p>
                <p className="font-bold text-red-500 text-lg">1900 1881</p>
              </div>
              <Button
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
                size="lg"
                className="px-8 py-6 text-base bg-red-500 hover:bg-red-600"
              >
                {loading ? 'Đang xử lý...' : 'Tiếp tục'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notice */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-700">
              <strong>Lưu ý:</strong> Sau khi nhấn "Tiếp tục", bạn sẽ được chuyển đến trang thanh toán VNPay. 
              Vui lòng hoàn tất thanh toán trong vòng 15 phút để đơn hàng không bị hủy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}