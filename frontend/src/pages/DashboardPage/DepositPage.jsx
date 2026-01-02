import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  ArrowLeft, 
  CreditCard, 
  Building2,
  Loader2,
  AlertCircle,
  Check,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createPaymentAPI, getBankListAPI } from '@/apis';
import { useNavigate } from 'react-router-dom';
import bankListData from '@/lib/bankList.json';
import { get } from 'lodash';

export default function DepositPage() {
  const navigate = useNavigate();

  // Balance & User Info
  // State để lưu thông tin số dư và user
  const [currentBalance, setCurrentBalance] = useState(0);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Deposit Amount
  // State quản lý số tiền nạp và validation error
  const [depositAmount, setDepositAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  
  // Payment Method Selection
  // State quản lý phương thức thanh toán và ngân hàng được chọn
  const [paymentMethod, setPaymentMethod] = useState('VNBANK');
  const [selectedBank, setSelectedBank] = useState('');
  
  // Bank List from VNPay API
  // State quản lý danh sách ngân hàng từ API
  const [bankList, setBankList] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  
  // UI States
  // State quản lý trạng thái UI
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  // Predefined amounts
  // Danh sách số tiền nạp nhanh
  const predefinedAmounts = [
    { amount: 500000, label: '500K', display: '500,000 ₫' },
    { amount: 1000000, label: '1M', display: '1,000,000 ₫' },
    { amount: 2000000, label: '2M', display: '2,000,000 ₫' },
    { amount: 3000000, label: '3M', display: '3,000,000 ₫' },
    { amount: 5000000, label: '5M', display: '5,000,000 ₫' },
    { amount: 10000000, label: '10M', display: '10,000,000 ₫' }
  ];

  // Payment methods (non-bank)
  // Danh sách các phương thức thanh toán
  const paymentMethods = [
    { code: 'ALL_BANKS', name: 'All Banks', icon: Banknote },
    { code: 'VNBANK', name: 'ATM / Internet Banking', icon: CreditCard },
    { code: 'INTCARD', name: 'International Card (Visa/Master/JCB)', icon: CreditCard }
  ];

  // Mock bank list (fallback nếu API lỗi)
  // Danh sách ngân hàng dự phòng khi API fail
  const mockBankList = [
    { bank_code: 'VCB', bank_name: 'Vietcombank', display_order: 1 },
    { bank_code: 'TCB', bank_name: 'Techcombank', display_order: 2 },
    { bank_code: 'MB', bank_name: 'MB Bank', display_order: 3 },
    { bank_code: 'VIB', bank_name: 'VIB Bank', display_order: 4 },
    { bank_code: 'ICB', bank_name: 'VietinBank', display_order: 5 },
    { bank_code: 'ACB', bank_name: 'ACB Bank', display_order: 6 },
    { bank_code: 'BIDV', bank_name: 'BIDV', display_order: 7 },
    { bank_code: 'TPB', bank_name: 'TPBank', display_order: 8 }
  ];

  // Fetch balance & user info on mount
  // Load thông tin user và số dư khi component mount
  useEffect(() => {
    // Mock data for demo - replace with actual API call
    // TODO: Thay bằng API call thực tế để lấy thông tin user
    setCurrentBalance(5000000);
    setUserName('Nguyen Van A');
    setUserEmail('user@example.com');
  }, []);

  // Fetch bank list when payment method changes
  // Load danh sách ngân hàng khi đổi phương thức thanh toán
  useEffect(() => {
    // Chỉ fetch bank list khi chọn VNBANK
    if (paymentMethod === 'VNBANK') {
      fetchBankList();
    } else {
      // Reset bank list và selection khi không phải VNBANK
      setBankList([]);
      setSelectedBank('');
    }
  }, [paymentMethod]);

  /**
   * Fetch bank list from VNPay API
   * Lấy danh sách ngân hàng từ VNPay API
   * POST https://sandbox.vnpayment.vn/qrpayauth/api/merchant/get_bank_list
   */
  const fetchBankList = async () => {
    setLoadingBanks(true);
    setBankError('');
    
    try {
      // TODO: Replace with your actual TMN_CODE
      // Thay TMN_CODE bằng mã merchant thực tế của bạn
      const TMN_CODE = '';
      
      // const response = await fetch(
      //   'https://sandbox.vnpayment.vn/qrpayauth/api/merchant/get_bank_list',
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     body: `tmn_code=${TMN_CODE}`
      //   }
      // );

      const response = await getBankListAPI();
      console.log('Bank List API Response:', response);

      // if (!response.ok) {
      //   throw new Error('Failed to fetch bank list');
      // }

      const data = await response.data;
      
      // Sort by display_order
      // Sắp xếp theo thứ tự hiển thị
      const sortedBanks = data
        // .filter(bank => bank.bank_type === 1) // Only ATM/Internet Banking
        .sort((a, b) => a.display_order - b.display_order);
      
      setBankList(sortedBanks);
      
      // Auto select first bank
      // Tự động chọn ngân hàng đầu tiên
      if (sortedBanks.length > 0) {
        setSelectedBank(sortedBanks[0].bank_code);
      }
    } catch (error) {
      console.error('Error fetching bank list:', error);
      setBankError('Unable to load bank list');
      
      // Use mock data as fallback
      // Dùng data mock khi API fail
      setBankList(bankListData);
      if (bankListData.length > 0) {
        setSelectedBank(bankListData[0].bank_code);
      }
    } finally {
      setLoadingBanks(false);
    }
  };

  /**
   * Format currency with Vietnamese locale
   * Format số tiền theo định dạng Việt Nam
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  /**
   * Validate deposit amount
   * Validate số tiền nạp (min: 10,000đ, max: 500,000,000đ)
   */
  const validateAmount = (value) => {
    const amount = parseInt(value);
    
    // Check if empty or not a number
    if (!value || isNaN(amount)) {
      setAmountError('Please enter an amount');
      return false;
    }
    
    // Check minimum amount
    if (amount < 10000) {
      setAmountError('Minimum amount is 10,000₫');
      return false;
    }
    
    // Check maximum amount
    if (amount > 500000000) {
      setAmountError('Maximum amount is 500,000,000₫');
      return false;
    }
    
    setAmountError('');
    return true;
  };

  /**
   * Handle amount input change
   * Xử lý khi user nhập số tiền
   */
  const handleAmountChange = (e) => {
    // Lấy giá trị và loại bỏ tất cả dấu chấm/phẩy
    const value = e.target.value.replace(/[.,]/g, '');
    
    // Chỉ cho phép số
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    setDepositAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setAmountError('');
    }
  };

  /**
   * Handle predefined amount click
   * Xử lý khi user click chọn số tiền có sẵn
   */
  const handlePredefinedAmountClick = (amount) => {
    setDepositAmount(amount.toString());
    validateAmount(amount.toString());
  };

  /**
   * Format input display with thousands separator
   * Format số tiền hiển thị trong input với dấu phân cách
   */
  const formatInputDisplay = (value) => {
    if (!value) return '';
    return formatCurrency(parseInt(value));
  };

  /**
   * Filter bank list based on search query
   * Lọc danh sách ngân hàng theo từ khóa tìm kiếm
   */
  const filteredBankList = bankList.filter(bank => 
    bank.bank_name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.bank_code.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  /**
   * Handle deposit submission
   * Xử lý khi user submit form nạp tiền
   */
  const handleDeposit = async () => {
    try {
      // Validate amount
      // Kiểm tra số tiền hợp lệ
      if (!validateAmount(depositAmount)) {
        return;
      }

      // Check email requirement for invoice
      // Kiểm tra email nếu cần xuất hóa đơn cho giao dịch >= 2M
      if (parseInt(depositAmount) >= 2000000 && showInvoiceDetails && !userEmail) {
        alert('Please enter email to receive invoice');
        return;
      }

      setLoading(true);
      
      /**
       * Xác định bankCode theo logic:
       * - ALL_BANKS => bankCode = '' (empty string)
       * - INTCARD => bankCode = 'INTCARD'
       * - VNBANK với selectedBank => bankCode = selectedBank
       * - VNBANK không có selectedBank => bankCode = ''
       */
      let finalBankCode = '';
      
      if (paymentMethod === 'ALL_BANKS') {
        // All banks - send empty string
        finalBankCode = '';
      } else if (paymentMethod === 'INTCARD') {
        // International card
        finalBankCode = 'INTCARD';
      } else if (paymentMethod === 'VNBANK') {
        // ATM/Internet Banking - chỉ gửi bankCode nếu có chọn ngân hàng
        finalBankCode = selectedBank || '';
      }

      // Log payload for debugging
      // Log để debug
      console.log('Payment Payload:', {
        amount: parseInt(depositAmount),
        paymentMethodCode: paymentMethod,
        bankCode: finalBankCode
      });

      // TODO: Replace with actual API call
      // Gọi API tạo payment
      const response = await createPaymentAPI(parseInt(depositAmount), finalBankCode);
      
      // Redirect to payment URL if successful
      // Redirect đến trang thanh toán VNPay nếu thành công
      if (response.success && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Unable to create payment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if form is valid for submission
   * Kiểm tra form có hợp lệ để submit không
   */
  const isFormValid = () => {
    if (!depositAmount || amountError) return false;
    // Không cần check selectedBank vì ALL_BANKS và INTCARD không cần chọn bank
    // VNBANK không bắt buộc phải chọn bank (có thể gửi empty string)
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Deposit to Account</h1>
          <p className="text-slate-600 mt-2">Choose amount and payment method</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Input Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Deposit Amount
                </CardTitle>
                <CardDescription>
                  Enter amount from 10,000₫ to 500,000,000₫
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-medium">
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="text"
                      placeholder="Enter amount"
                      value={formatInputDisplay(depositAmount)}
                      onChange={handleAmountChange}
                      className={`text-lg py-6 pr-12 ${amountError ? 'border-red-500' : ''}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                      ₫
                    </span>
                  </div>
                  {amountError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {amountError}
                    </p>
                  )}
                  {depositAmount && !amountError && (
                    <p className="text-sm text-slate-600">
                      Amount: <span className="font-semibold text-blue-600">{formatCurrency(parseInt(depositAmount))} VND</span>
                    </p>
                  )}
                </div>

                {/* Predefined Amounts */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Quick Select</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {predefinedAmounts.map((item) => (
                      <button
                        key={item.amount}
                        onClick={() => handlePredefinedAmountClick(item.amount)}
                        className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          depositAmount === item.amount.toString()
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        {depositAmount === item.amount.toString() && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <p className="font-bold text-lg text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-600 mt-1">{item.display}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.code}
                          className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            paymentMethod === method.code
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <RadioGroupItem value={method.code} id={method.code} />
                          <Icon className={`w-5 h-5 ${paymentMethod === method.code ? 'text-blue-600' : 'text-slate-600'}`} />
                          <span className="flex-1 font-medium">{method.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </RadioGroup>

                {/* Bank List (only show for VNBANK) */}
                {/* Danh sách ngân hàng - chỉ hiển thị khi chọn VNBANK */}
                {paymentMethod === 'VNBANK' && (
                  <div className="space-y-3 pt-4">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Select Bank</Label>
                      
                      {/* Search Input */}
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading state */}
                    {loadingBanks ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : bankError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{bankError} - Using default list</AlertDescription>
                      </Alert>
                    ) : null}

                    {/* Bank Grid */}
                    <ScrollArea className="h-[500px] rounded-lg border border-slate-200 bg-white">
                      <div className="grid grid-cols-4 gap-2 m-4">
                        {filteredBankList.map((bank) => (
                          <button
                            key={bank.bank_code}
                            onClick={() => setSelectedBank(bank.bank_code)}
                            className={`relative h-20 rounded-xs border-2 transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 ${
                              selectedBank === bank.bank_code
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Selected indicator */}
                            {selectedBank === bank.bank_code && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {/* Bank logo or fallback icon */}
                            <div className="w-full h-full flex items-center justify-center">
                              {bank.logo_link ? (
                                <img
                                  src={`${bank.logo_link}`}
                                  alt={bank.bank_name}
                                  className="w-full h-full object-contain"
                                />
                              ) : null}
                              <Building2 
                                className="bank-icon w-12 h-12 text-slate-300"
                                style={{ display: bank.logo_link ? 'none' : 'block' }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {/* Empty state */}
                      {filteredBankList.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <AlertCircle className="w-12 h-12 mb-2" />
                          <p className="text-sm">No banks found</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            {/* Thông tin xuất hóa đơn - optional */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="cursor-pointer" onClick={() => setShowInvoiceDetails(!showInvoiceDetails)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Invoice Information</CardTitle>
                  {showInvoiceDetails ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <CardDescription>
                  Optional - Only for transactions from 2,000,000₫
                </CardDescription>
              </CardHeader>
              {showInvoiceDetails && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyerName">Full Name</Label>
                      <Input
                        id="buyerName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email for Invoice</Label>
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
                    <Label htmlFor="companyName">Company Name (if applicable)</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Balance */}
            {/* Hiển thị số dư hiện tại */}
            <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentBalance)} ₫</p>
                  </div>
                  <Wallet className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {/* Tóm tắt giao dịch - chỉ hiển thị khi có số tiền hợp lệ */}
            {depositAmount && !amountError && (
              <Card className="shadow-sm border-slate-200 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Deposit Amount:</span>
                      <span className="font-semibold">{formatCurrency(parseInt(depositAmount))} ₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Method:</span>
                      <span className="font-semibold">
                        {paymentMethods.find(m => m.code === paymentMethod)?.name}
                      </span>
                    </div>
                    {paymentMethod === 'VNBANK' && selectedBank && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Bank:</span>
                        <span className="font-semibold">
                          {bankList.find(b => b.bank_code === selectedBank)?.bank_name}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-bold">Total Payment:</span>
                      <span className="font-bold text-blue-600 text-xl">
                        {formatCurrency(parseInt(depositAmount))} ₫
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleDeposit}
                    disabled={loading || !isFormValid()}
                    size="lg"
                    className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Deposit'
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By continuing, you agree to the terms of service
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            {/* Thông tin hotline hỗ trợ */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Support Hotline</p>
                  <p className="text-2xl font-bold text-red-500">1900 1881</p>
                  <p className="text-xs text-slate-500 mt-2">Available 24/7</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notice */}
        {/* Thông báo quan trọng cho user */}
        <Alert className="mt-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-slate-700">
            <strong>Note:</strong> After clicking "Proceed to Deposit", you will be redirected to VNPay payment page.
            Please complete the payment within 15 minutes to avoid order cancellation.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}