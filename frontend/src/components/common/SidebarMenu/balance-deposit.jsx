import React, { useState, useEffect } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBalanceAPI } from '@/apis';
import { useNavigate } from 'react-router-dom';

export default function BalanceAndDeposit({ currency = 'đ' }) {
    const navigate = useNavigate();
    const [currentBalance, setCurrentBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            setLoading(true);
            const response = await getBalanceAPI();
            if (response.success) {
                setCurrentBalance(response.balance || 0);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const formattedBalance = loading 
        ? '...' 
        : `${currentBalance.toLocaleString('vi-VN')}${currency}`;

    const handleDepositClick = () => {
        navigate('/dashboard/deposit');
    };

    return (
        <div className="flex items-center space-x-2">
            <div 
                className="flex items-center rounded-full border border-input bg-background px-3 py-1.5 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={fetchBalance}
            >
                <span className="text-xl text-red-600 mr-2">
                    <img 
                        src="/images/logo/logo.png" 
                        alt="Logo" 
                        className="h-4 w-4"
                    />
                </span>
                <span className="font-semibold text-sm">{formattedBalance}</span>
                <ChevronDown size={16} className="ml-1 text-muted-foreground" />
            </div>

            <Button 
                onClick={handleDepositClick}
                className="text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold py-1.5 px-4 rounded-full transition-colors"
                disabled={loading}
            >
                Nạp tiền
            </Button>
        </div>
    );
}