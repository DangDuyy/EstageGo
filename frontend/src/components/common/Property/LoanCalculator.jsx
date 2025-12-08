import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ChevronRight, Info } from 'lucide-react';
import { exportAmortizationExcel } from '@/utils/helper';
import { NumericFormat } from 'react-number-format';

export default function LoanCalculator({ propertyPrice = 0 }) {
    const [housePrice, setHousePrice] = useState(propertyPrice.toString());
    const [interestRate, setInterestRate] = useState('33.3');
    const [loanAmount, setLoanAmount] = useState('');
    const [loanTerm, setLoanTerm] = useState('5');
    const [bankRate, setBankRate] = useState('7.5');
    const [propertyType, setPropertyType] = useState('decreasing');
    const [principalPercent, setPrincipalPercent] = useState(0);
    const [interestPercent, setInterestPercent] = useState(0);
    const [remainingPercent, setRemainingPercent] = useState(0);

    const [results, setResults] = useState({
        totalPayment: 0,
        principalAmount: 0,
        interestAmount: 0,
        remainingInterest: 0,
        monthlyPayment: 0
    });

    useEffect(() => {
        calculateLoan();
    }, [housePrice, interestRate, loanAmount, loanTerm, bankRate, propertyType]);

    // // tính toán các giá trị vay khi các input thay đổi
    useEffect(() => {
        const calculatedLoanAmount = Math.round((parseFloat(housePrice.replace(/\./g, '')) * parseFloat(interestRate)) / 100);
        setLoanAmount(calculatedLoanAmount.toString());
    }, [housePrice, interestRate]);

    // useEffect(() => {
    //     const calculatedInterestRate = ((parseFloat(loanAmount.replace(/\./g, '')) / parseFloat(housePrice.replace(/\./g, ''))) * 100).toFixed(1);
    //     setInterestRate(calculatedInterestRate.toString());
    // }, [loanAmount]);

    const calculateLoan = () => {
        const P = parseFloat(loanAmount.replace(/\./g, '')) || 0;
        const annualRate = parseFloat(bankRate) / 100;
        const monthlyRate = annualRate / 12;
        const n = parseInt(loanTerm) * 12;

        if (P === 0 || n === 0 || monthlyRate === 0) {
            return;
        }

        // Tính theo dư nợ giảm dần (reducing balance)
        if (propertyType === 'decreasing') {
            const principalPayment = P / n;
            let totalInterest = 0;
            let remainingPrincipal = P;

            for (let i = 0; i < n; i++) {
                const interestPayment = remainingPrincipal * monthlyRate;
                totalInterest += interestPayment;
                remainingPrincipal -= principalPayment;
            }

            const firstMonthInterest = P * monthlyRate;
            const firstMonthPayment = principalPayment + firstMonthInterest;

            setResults({
                totalPayment: totalInterest + parseFloat(housePrice.replace(/\./g, '')),
                principalAmount: P,
                interestAmount: totalInterest,
                remainingInterest: totalInterest,
                monthlyPayment: firstMonthPayment
            });
        } else {
            // Tính theo dư nợ cố định (fixed payment)
            const monthlyPayment = P * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
            const totalPayment = monthlyPayment * n;
            const totalInterest = totalPayment - P;

            setResults({
                totalPayment: totalInterest + parseFloat(housePrice.replace(/\./g, '')),
                principalAmount: P,
                interestAmount: totalInterest,
                remainingInterest: totalInterest,
                monthlyPayment: monthlyPayment
            });
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(value));
    };

    const calculatePercentage = (value, total) => {
        console.log('Calculating percentage', value, total);
        return ((value / total) * 100).toFixed(1);
    };

    useEffect(() => {
        if (results.totalPayment > 0) {
            setPrincipalPercent(calculatePercentage(parseFloat(housePrice) - parseFloat(loanAmount), results.totalPayment));
            setInterestPercent(calculatePercentage(results.principalAmount, results.totalPayment));
            setRemainingPercent(calculatePercentage(results.remainingInterest, results.totalPayment));
        }
    }, [results]);

    const handleDownloadSchedule = () => {
        console.log('Data', {
            loanAmount,
            bankRate,
            loanTerm,
            propertyType
        });
        exportAmortizationExcel({
            principal: parseFloat(loanAmount.replace(/\./g, '')),
            annualRate: parseFloat(bankRate),
            years: parseInt(loanTerm),
            loanType: propertyType === 'decreasing' ? 'decreasing' : 'fixed'
        });
    };

    return (
        <section className="space-y-3 pb-6">
            <h3 className="text-xl font-semibold">Loan Calculator</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Input Form */}
                <div className="pt-6 space-y-6">
                    {/* Giá trị nhà đất */}
                    <div className="space-y-2">
                        <Label htmlFor="housePrice">Giá trị nhà đất</Label>
                        <div className="relative">
                            <NumericFormat
                                id="housePrice"
                                value={housePrice}
                                thousandSeparator="."
                                decimalSeparator=","
                                allowNegative={false}
                                decimalScale={2}
                                placeholder="0"
                                isNumericString
                                inputMode="numeric"
                                customInput={Input}  // dùng Input của shadcn
                                className="pr-8"
                                onValueChange={({ value }) => setHousePrice(value)}
                            // value = raw "1000000"
                            // formattedValue = "1.000.000"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                ₫
                            </span>
                        </div>
                    </div>


                    {/* Tỉ lệ vay và Số tiền vay */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interestRate">Tỉ lệ vay</Label>
                            <div className="relative">
                                <NumericFormat
                                    id="interestRate"
                                    customInput={Input}
                                    value={interestRate}
                                    // suffix="%"
                                    placeholder="0"
                                    decimalSeparator=","
                                    thousandSeparator="."
                                    decimalScale={2}     // 10,25% etc
                                    allowNegative={false}
                                    onValueChange={({ value }) => setInterestRate(value)}
                                    inputMode="decimal"
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loanAmount">Số tiền vay</Label>
                            <div className="relative">
                                <NumericFormat
                                    id="loanAmount"
                                    value={loanAmount}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    allowNegative={false}
                                    decimalScale={2}
                                    placeholder="0"
                                    isNumericString
                                    inputMode="decimal"
                                    customInput={Input}  // dùng Input của shadcn
                                    className="pr-8"
                                    onValueChange={({ value }) => setLoanAmount(value)}
                                // value = raw "1000000"
                                // formattedValue = "1.000.000"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Thời hạn vay */}
                        <div className="space-y-2">
                            <Label htmlFor="loanTerm">Thời hạn vay</Label>
                            <div className="relative">
                                <Input
                                    id="loanTerm"
                                    type="text"
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(e.target.value.replace(/\D/g, ''))}
                                    className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">năm</span>
                            </div>
                        </div>

                        {/* Lãi suất theo ngân hàng */}
                        <div className="space-y-2">
                            <Label>Lãi suất %/năm</Label>
                            <div>
                                <div className="relative">
                                    <NumericFormat
                                        customInput={Input}
                                        value={bankRate}
                                        // suffix="%"
                                        placeholder="0"
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}     // 10,25% etc
                                        allowNegative={false}
                                        onValueChange={({ value }) => setBankRate(value)}
                                        inputMode="decimal"
                                        className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loại hình */}
                    <div className="space-y-2">
                        <Label>Loại hình</Label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="decreasing">Dư nợ giảm dần</SelectItem>
                                <SelectItem value="fixed">Dư nợ cố định</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Warning */}
                    <Alert variant="default">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Kết quả ước tính này chỉ dùng cho mục đích tham khảo.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Right Column - Results */}
                <Card className="mt-6 shadow-xl">
                    <CardContent className="space-y-6">
                        {/* Total Payment */}
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng số tiền bạn cần trả</p>
                            <h2 className="text-2xl font-bold mb-4">{formatCurrency(results.totalPayment)} triệu</h2>

                            {/* Progress */}
                            <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden mb-2 flex">
                                <div className="h-full bg-teal-500 transition-all" style={{ width: `${principalPercent}%` }} />
                                <div className="h-full bg-purple-400 transition-all" style={{ width: `${interestPercent}%` }} />
                                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${remainingPercent}%` }} />
                            </div>

                            {/* Percent under each corresponding segment */}
                            <div className="relative flex text-xs font-medium">
                                <span className="text-teal-600 text-center" style={{ width: `${principalPercent}%` }}>
                                    {principalPercent}%
                                </span>
                                <span className="text-purple-500 text-center" style={{ width: `${interestPercent}%` }}>
                                    {interestPercent}%
                                </span>
                                <span className="text-yellow-500 text-center" style={{ width: `${remainingPercent}%` }}>
                                    {remainingPercent}%
                                </span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                                    <span className="text-sm">Vốn tự có</span>
                                </div>
                                <span className="text-sm font-semibold">{formatCurrency(parseFloat(housePrice) - parseFloat(loanAmount))} ₫</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                                    <span className="text-sm">Gốc cần trả</span>
                                </div>
                                <span className="text-sm font-semibold">{formatCurrency(results.principalAmount)} ₫</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <span className="text-sm">Lãi cần trả</span>
                                </div>
                                <span className="text-sm font-semibold">{formatCurrency(results.remainingInterest)} ₫</span>
                            </div>
                        </div>

                        {/* Monthly Payment */}
                        <div className="pt-2 pb-2 border-t border-b">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Thanh toán tháng đầu</span>
                                <span className="text-lg font-bold">{formatCurrency(results.monthlyPayment)} ₫</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button onClick={handleDownloadSchedule} variant="outline" className="w-full text-red-500 border-red-500 hover:bg-red-50">
                                <Download className="w-4 h-4 mr-2" />
                                Chi tiết kế hoạch tài chính
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
