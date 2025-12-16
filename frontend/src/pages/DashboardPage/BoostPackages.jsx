import { useState, useEffect } from "react";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Package, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUser } from "@/redux/user/userSlice";
import { cn } from "@/lib/utils";
import { purchaseBoostPackageAPI, getBalanceAPI } from "@/apis";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BoostPackages() {
  const dispatch = useDispatch();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  const currentUser = useSelector(selectCurrentUser);
  const boostCredits = currentUser?.boostCredits || 0;

  const membership = currentUser?.membershipLevel || 'basic';
  const basePerBoostMap = { basic: 100000, standard: 75000, premium: 50000 };
  const discountMap = { basic: 0, standard: 0.1, premium: 0.2 };
  const basePerBoost = basePerBoostMap[membership];
  const discountRate = discountMap[membership] || 0;

  const packages = [
    {
      id: "small",
      name: "Starter Pack",
      icon: Package,
      description: "Perfect for trying out boost features",
      credits: 5,
      price: 400000,
      popular: false
    },
    {
      id: "medium",
      name: "Value Pack",
      icon: TrendingUp,
      description: "Best value for regular users",
      credits: 10,
      price: 700000,
      popular: true
    },
    {
      id: "large",
      name: "Power Pack",
      icon: Sparkles,
      description: "For serious property sellers",
      credits: 20,
      price: 1200000,
      popular: false
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePurchaseClick = async (pkg) => {
    setSelectedPackage(pkg);
    
    // Fetch current balance
    try {
      const response = await getBalanceAPI();
      if (response.success) {
        setCurrentBalance(response.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error('Failed to fetch balance');
      return;
    }
    
    setShowConfirm(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      const response = await purchaseBoostPackageAPI(selectedPackage.id);

      // Compute credits/balance from response or locally as fallback
      const creditsFromResponse = response?.totalCredits;
      const newBalanceFromResponse = response?.newBalance;
      const computedCredits = creditsFromResponse ?? ((currentUser?.boostCredits || 0) + (selectedPackage?.credits || 0));
      const computedBalance = newBalanceFromResponse ?? (currentBalance - (selectedPackage?.price || 0));

      // Update local user state so UI reflects immediately
      dispatch(updateUser({
        boostCredits: computedCredits,
        balance: computedBalance
      }));

      setShowConfirm(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to purchase package';
      
      if (error.response?.status === 402) {
        toast.error(`Insufficient balance. Please deposit funds first.`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ContentLayout title="Boost Packages">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-10 w-10 text-orange-500" />
            <h1 className="text-4xl font-bold">Boost Packages</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purchase boost credits to push your properties to the top and get more visibility
          </p>

          {/* Current Credits Display */}
          <Card className="max-w-md mx-auto bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Boost Credits</p>
                <div className="flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-orange-500" />
                  <span className="text-4xl font-bold text-orange-600">{boostCredits}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Available credits to boost your properties</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            const discountedPrice = Math.round(pkg.price * (1 - discountRate));
            const effectivePerBoost = Math.round(discountedPrice / pkg.credits);
            const baselineTotal = basePerBoost * pkg.credits;
            const savings = Math.max(0, baselineTotal - discountedPrice);
            const savingsPercent = savings > 0 ? Math.round((savings / baselineTotal) * 100) : 0;

            return (
              <Card 
                key={pkg.id} 
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  pkg.popular && "border-orange-500 border-2 shadow-lg"
                )}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
                    <Icon className="h-8 w-8 text-orange-500" />
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold">
                        {formatPrice(discountedPrice)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{pkg.credits} Boost Credits</p>
                      <p className="text-xs">≈ {formatPrice(effectivePerBoost)} per boost</p>
                    </div>
                    {savingsPercent > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Save {savingsPercent}%
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium text-center">What you get:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span>{pkg.credits} property boosts</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span>Instant visibility boost</span>
                      </li>
                      {pkg.savings > 0 && (
                        <li className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          <span>Save {formatPrice(savings)}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={pkg.popular ? "default" : "outline"}
                    disabled={purchasing}
                    onClick={() => handlePurchaseClick({ ...pkg, effectivePrice: Math.round(pkg.price * (1 - discountRate)) })}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Purchase for ${formatPrice(discountedPrice)}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>How Boost Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">What is boosting?</h4>
                <p className="text-sm text-muted-foreground">
                  Boosting pushes your property to the top of search results, giving it maximum visibility to potential buyers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">When to boost?</h4>
                <p className="text-sm text-muted-foreground">
                  Boost your properties when they start to slip down in search results or when you want immediate attention.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Credits vs Direct Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Save money by purchasing credit packages! Direct boost costs more per use than packaged credits.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">No Expiration</h4>
                <p className="text-sm text-muted-foreground">
                  Your boost credits never expire. Use them whenever you need to give your properties an extra push.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <>
                {selectedPackage && (
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Package:</span>
                        <span>{selectedPackage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Credits:</span>
                        <span>{selectedPackage.credits} boosts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Price:</span>
                        <span className="font-semibold">{formatPrice(selectedPackage.price)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>Your Balance:</span>
                        <span className={cn(
                          "font-semibold",
                          currentBalance < selectedPackage.price ? "text-red-600" : "text-green-600"
                        )}>
                          {formatPrice(currentBalance)}
                        </span>
                      </div>
                    </div>
                    {currentBalance < selectedPackage.price && (
                      <p className="text-red-600 text-sm">
                        Insufficient balance. Please deposit {formatPrice(selectedPackage.price - currentBalance)} more.
                      </p>
                    )}
                  </div>
                )}
              </>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPurchase}
              disabled={purchasing || (selectedPackage && currentBalance < selectedPackage.price)}
            >
              {purchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Purchase"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentLayout>
  );
}
