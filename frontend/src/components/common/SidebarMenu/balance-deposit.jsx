import React from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Giả sử bạn dùng thư viện UI có component Button
import { Image } from '@radix-ui/react-avatar';

// Thay thế các icon và component theo thư viện UI bạn đang dùng

export default function BalanceAndDeposit({ currentBalance = 0, currency = 'đ' }) {
    // Định dạng số dư theo tiền tệ
    const formattedBalance = `${currentBalance.toLocaleString('vi-VN')}${currency}`;

    const handleDepositClick = () => {
        // Xử lý logic khi nhấn nút Nạp tiền, ví dụ: chuyển hướng đến trang nạp tiền
        console.log("Deposit button clicked");
        // router.push('/deposit');
    };

    return (
        <div className="flex items-center space-x-2">
            {/* Phần hiển thị số dư */}
            <div className="flex items-center rounded-full border border-input bg-background px-3 py-1.5 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors">
                {/* Icon nhà hoặc ví, thay thế bằng icon bạn dùng trong ảnh */}
               <span className="text-xl text-red-600 mr-2">
                    {/* SỬA LỖI Ở ĐÂY: Dùng thẻ <img> HTML tiêu chuẩn */}
                    <img 
                        src="/images/logo/logo.png" 
                        alt="Logo" 
                        className="h-4 w-4" // Bạn cần thêm class để kiểm soát kích thước
                    />
                </span>
                <span className="font-semibold text-sm">{formattedBalance}</span>
                <ChevronDown size={16} className="ml-1 text-muted-foreground" />
            </div>

            {/* Nút Nạp tiền */}
            <Button 
                onClick={handleDepositClick}
                className=" text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold py-1.5 px-4 rounded-full transition-colors"
                // Hoặc sử dụng className theo phong cách của component Button trong ảnh (màu đen, bo góc lớn)
            >
                Nạp tiền
            </Button>
        </div>
    );
}