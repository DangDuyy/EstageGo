import React, { useState, useEffect } from 'react';
import { ChevronDown, Wallet, Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

    const handleTransactionHistoryClick = () => {
        navigate('/dashboard/transactions');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div 
                    className="flex items-center rounded-full border border-input bg-background px-3 py-1.5 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                    onClick={handleDepositClick}
                    className="cursor-pointer"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Deposit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={handleTransactionHistoryClick}
                    className="cursor-pointer"
                >
                    <History className="mr-2 h-4 w-4" />
                    <span>Transaction History</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}