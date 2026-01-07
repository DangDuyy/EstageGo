import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/redux/user/userSlice';
import { getCurrentUserAPI } from '@/apis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const dispatch = useDispatch();
  
  const success = searchParams.get('success') === 'true';
  const message = searchParams.get('message') || '';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus(success ? 'success' : 'failed');
    }, 1500);

    // Refresh user/balance immediately after successful payment
    const refreshUser = async () => {
      if (success) {
        try {
          const user = await getCurrentUserAPI();
          if (user) dispatch(updateUser(user));
        } catch (err) {
          console.warn('Failed to refresh user after payment:', err);
        }
      }
    };
    refreshUser();

    return () => clearTimeout(timer);
  }, [success, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(parseInt(amount));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium">Processing payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'success' ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your transaction has been processed successfully
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-20 h-20 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
              <CardDescription>
                {message || 'An error occurred during payment processing'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold">{orderId}</span>
              </div>
              {amount !== '0' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatCurrency(amount)} đ</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/dashboard/deposit')}
            >
              {status === 'success' ? 'Deposit More' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}