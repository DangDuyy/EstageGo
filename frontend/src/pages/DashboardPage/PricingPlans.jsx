import { useEffect, useState } from "react";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBalanceAPI, getMembershipConfigs, subscribe, getActiveMembership } from "@/apis";
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

export default function PricingPlans() {
  return (
    <ContentLayout title="Membership Plans">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upgrade your account to unlock premium features and boost your property listings
          </p>

          <MembershipPricingCards />
        </div>

        {/* FAQ or Additional Info */}
        <Card className="max-w-5xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Need Help Choosing?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">What happens when I upgrade?</h4>
                <p className="text-sm text-muted-foreground">
                  Your new plan takes effect immediately. You'll have access to all premium features right away and enjoy discounted listing fees.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I switch plans?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade anytime. Contact support for downgrades or plan changes.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-muted-foreground">
                  Payment is deducted from your account balance. You can deposit funds via VNPay, bank transfer, or credit card.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is there a money-back guarantee?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! We offer a 7-day money-back guarantee if you're not satisfied with your plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}

const MembershipPricingCards = () => {
  const [packages, setPackages] = useState([])
  const [currentMembership, setCurrentMembership] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);


  const handleUpgradeClick = async (pkg) => {
    setSelectedPlan(pkg)
    // Fetch current balance
    try {
      const response = await getBalanceAPI();
      if (response.success) {
        setCurrentBalance(response.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }

    setShowConfirm(true);
  };

  useEffect(() => {
    const fetchMembershipConfigs = async () => {
      let response = await getMembershipConfigs()
      response = response.data

      response.forEach((p) => {
        if (p.membershipType === 'advanced') {
          p.badge = 'x5 Effectiveness'
          p.subtitle = 'compared to Basic Listing'
          p.bgGradient = 'from-yellow-500 via-yellow-200 to-amber-100'
          p.bgColor = 'bg-amber-50'
          p.accentColor = 'text-amber-700'
          p.title = 'Lead the Competitive Position'
          p.description =
            'For professional agents who want to lead the market, maximize performance, and build a strong professional image.'
          p.popular = false
          p.accountBenefits = [
            'Bonus 10 advanced listings',
            'Unlimited displayed listings',
            'Professional agent profile page',
            // 'Listing performance reports'
          ]
        } else if (p.membershipType === 'boosted') {
          p.badge = 'x2.5 Effectiveness'
          p.subtitle = 'compared to Basic Listing'
          p.bgGradient = 'from-blue-300 via-blue-100 to-indigo-100'
          p.bgColor = 'bg-blue-50'
          p.accentColor = 'text-blue-700'
          p.title = 'Increase Reach and Credibility'
          p.description =
            'For professional agents who want higher performance at a reasonable cost with flexible analytics tools.'
          p.popular = true
          p.accountBenefits = [
            'Bonus 10 boosted listings',
            'Unlimited displayed listings',
            'Professional agent profile page',
            // 'Listing performance reports'
          ]
        } else if (p.membershipType === 'basic') {
          p.badge = 'Standard Effectiveness'
          p.subtitle = 'stable'
          p.bgGradient = 'from-gray-500 via-gray-200 to-slate-100'
          p.bgColor = 'bg-gray-50'
          p.accentColor = 'text-gray-700'
          p.title = 'Maintain Presence'
          p.description =
            'For agents with basic posting needs. A solution to maintain visibility on the platform.'
          p.popular = false
          p.accountBenefits = [
            'Bonus 10 basic listings',
            'Unlimited displayed listings'
          ]
        }
      })

      // Sort by pricing[0].price (ascending)
      response.sort(
        (a, b) => (b.pricing?.[0]?.price || 0) - (a.pricing?.[0]?.price || 0)
      )

      setPackages(response)
    }

    fetchMembershipConfigs()
  }, [])


  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  }

  const onSubmitSubscribe = async (membershipType) => {
    try {
      setUpgrading(true)
      const response = await subscribe(membershipType)
      setUpgrading(false)

      if (response.success) {
        toast.success(`Successfully upgraded to ${response.data.config.displayName.en} membership!`);

        // Reload page after a short delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upgrade membership';

      if (error.response?.status === 402) {
        toast.error(`Insufficient balance. Please deposit funds first.`);
      } else {
        toast.error(errorMessage);
      }
    }
  }

  useEffect(() => {
    const fetchActiveMembership = async () => {
      const response = await getActiveMembership()
      setCurrentMembership(response.data)
    }

    fetchActiveMembership()
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        {packages.map((pkg) => (
          <div className="relative">
            {currentMembership?.membershipType === pkg.membershipType ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 z-10">
                Current Membership
              </Badge>
            ) : <></>}
            <Card
              key={pkg.membershipType}
              className={`overflow-hidden border-0 p-0 gap-0 ${currentMembership?.membershipType === pkg.membershipType ? 'border-orange-500 border-2 shadow-lg' : ''}`}
            >

              {pkg.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Popular
                  </Badge>
                </div>
              )}

              {/* Header Section */}
              <div className={`bg-gradient-to-br ${pkg.bgGradient} p-8 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="text-xs text-gray-600 mb-1">PACKAGE</div>
                  <h3 className="text-3xl font-bold mb-3">{pkg.displayName.en}</h3>

                  <div
                    className={`inline-block bg-gradient-to-r ${pkg.bgColor} px-3 py-1 rounded-sm mb-1`}
                  >
                    <span className={`font-bold ${pkg.accentColor}`}>
                      {pkg.badge}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    {pkg.subtitle}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className={`${pkg.bgColor} p-6 rounded-b-3xl`}>
                <div className="min-h-30">
                  <h4 className="text-lg font-bold mb-2">{pkg.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {pkg.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">STARTING FROM</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">
                      {formatPrice(pkg.pricing[0]?.price)}
                    </span>
                    <span className="text-sm text-gray-600">
                      VND / month
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <CardContent className="p-6 space-y-6">
                <Button onClick={() => handleUpgradeClick(pkg)}
                  disabled={currentMembership}
                  className="w-full font-medium py-6 rounded-lg text-base">
                  Subscribe Now
                </Button>

                {/* Account Benefits */}
                <div className="space-y-3 min-h-60">
                  <h5 className="font-bold text-base border-b pb-2">
                    Account Benefits
                  </h5>

                  <div className="space-y-2.5">
                    {pkg.accountBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          <img
                            src="https://static.chotot.com/storage/subscriptions/sk_landing_page/check_3.png"
                            alt="check"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Listing Benefits */}
                {/* <div className="space-y-3">
                <h5 className="font-medium text-base">
                  Tin đăng hiển thị <span className={`font-bold ${pkg.accentColor}`}>{pkg.name}</span>
                </h5>
                <div className="space-y-2.5">
                  {pkg.listingBenefits.map((benefit, index) => {
                    const isHighlight = typeof benefit === 'object' && benefit.highlight;
                    const text = typeof benefit === 'object' ? benefit.text : benefit;

                    return (
                      <div key={index} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          <img
                            src="https://static.chotot.com/storage/subscriptions/sk_landing_page/check_3.png"
                            alt="check"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {isHighlight ? (
                            <>
                              <span className="font-bold">Đặc quyền</span>
                              {text.replace('Đặc quyền', '')}
                            </>
                          ) : (
                            text
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div> */}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Membership Upgrade</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {selectedPlan && (
                <>
                  <div className="space-y-2">
                    <p>You are about to upgrade to <strong>{selectedPlan.displayName.en}</strong> membership.</p>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span className="font-semibold">{selectedPlan.displayName.en}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Billing:</span>
                        <span className="font-semibold capitalize">Monthly</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-semibold">{formatPrice(selectedPlan.pricing[0].price)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>Your Balance:</span>
                        <span className={cn(
                          "font-semibold",
                          currentBalance < selectedPlan.pricing[0].price ? "text-red-600" : "text-green-600"
                        )}>
                          {formatPrice(currentBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentBalance < selectedPlan.pricing[0].price && (
                    <p className="text-red-600 text-sm">
                      Insufficient balance. Please deposit {formatPrice(selectedPlan.pricing[0].price - currentBalance)} more.
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={upgrading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onSubmitSubscribe(selectedPlan.membershipType)}
              disabled={upgrading || (selectedPlan && currentBalance < selectedPlan.pricing[0].price)}
            >
              {upgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Upgrade"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// export default MembershipPricingCards;