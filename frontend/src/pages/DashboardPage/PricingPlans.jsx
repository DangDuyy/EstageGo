import { useState } from "react";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/user/userSlice";
import { cn } from "@/lib/utils";

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | yearly
  const currentUser = useSelector(selectCurrentUser);
  const currentPlan = currentUser?.membershipLevel || "basic";

  const plans = [
    {
      id: "standard",
      name: "Standard",
      icon: Star,
      description: "Perfect for individual agents and small teams",
      monthlyPrice: 1000000,
      yearlyPrice: 1000000 * 12 * 0.64, // 36% discount
      features: [
        "Post up to 50 properties",
        "Featured listing badge",
        "Priority in search results",
        "Basic analytics dashboard",
        "Email support",
        "Mobile app access"
      ],
      popular: false
    },
    {
      id: "premium",
      name: "Premium",
      icon: Crown,
      description: "For professional agents and agencies",
      monthlyPrice: 2000000,
      yearlyPrice: 2000000 * 12 * 0.64, // 36% discount
      features: [
        "Unlimited property posts",
        "VIP listing badge",
        "Top priority in search results",
        "Advanced analytics & reports",
        "Priority support 24/7",
        "API access",
        "Custom branding",
        "Lead management tools"
      ],
      popular: true
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPrice = (plan) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPricePerMonth = (plan) => {
    if (billingCycle === "monthly") return plan.monthlyPrice;
    return plan.yearlyPrice / 12;
  };

  const isCurrentPlan = (planId) => {
    if (planId === "standard" && currentPlan === "standard") return true;
    if (planId === "premium" && currentPlan === "premium") return true;
    return false;
  };

  const canUpgrade = (planId) => {
    if (currentPlan === "basic") return true;
    if (currentPlan === "standard" && planId === "premium") return true;
    return false;
  };

  const handleUpgrade = (planId) => {
    // TODO: Implement payment flow
    console.log(`Upgrading to ${planId} - ${billingCycle}`);
  };

  return (
    <ContentLayout title="Membership Plans">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upgrade your account to unlock premium features and boost your property listings
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={cn(
              "text-sm font-medium transition-colors",
              billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"
            )}>
              Monthly
            </span>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative h-10 w-20 rounded-full p-0"
            >
              <div
                className={cn(
                  "absolute top-1 h-8 w-8 rounded-full bg-primary transition-all duration-200",
                  billingCycle === "monthly" ? "left-1" : "left-11"
                )}
              />
            </Button>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium transition-colors",
                billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"
              )}>
                Yearly
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                Save 36%
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const current = isCurrentPlan(plan.id);
            const canBuy = canUpgrade(plan.id);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:shadow-lg",
                  plan.popular && "border-primary shadow-md",
                  current && "ring-2 ring-primary"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {current && (
                  <div className="absolute top-0 left-0">
                    <Badge className="rounded-none rounded-br-lg bg-green-600">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold">
                        {formatPrice(getPricePerMonth(plan))}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(getPrice(plan))} billed yearly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={current ? "secondary" : plan.popular ? "default" : "outline"}
                    disabled={current || !canBuy}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {current ? "Current Plan" : canBuy ? `Upgrade to ${plan.name}` : "Not Available"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
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
                  Your new plan takes effect immediately. You'll have access to all premium features right away.
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
                  We accept all major credit cards, bank transfers, and local payment methods.
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
