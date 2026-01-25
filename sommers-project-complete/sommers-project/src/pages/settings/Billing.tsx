/**
 * Sommer's Proposal System - Billing Page
 * Subscription management, invoices, and payment methods
 */

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  ExternalLink,
  Check,
  Crown,
  Sparkles,
  Building2,
  Users,
  Zap,
  FileText,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PlanBadge } from '@/components/entitlements/FeatureGate';

// ============================================================================
// TYPES
// ============================================================================

interface Plan {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  features: string[];
  limits: { proposals: number; team: number; storage: string };
  popular?: boolean;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'past_due';
  pdfUrl: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    features: ['5 proposals/month', '1 team member', 'Basic templates', 'Email support'],
    limits: { proposals: 5, team: 1, storage: '100MB' },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29, yearly: 290 },
    features: ['50 proposals/month', '5 team members', 'Custom branding', 'AI assistant', 'Advanced analytics', 'Priority support'],
    limits: { proposals: 50, team: 5, storage: '5GB' },
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: { monthly: 79, yearly: 790 },
    features: ['Unlimited proposals', '20 team members', 'API access', 'Automation workflows', 'White label', 'Custom integrations'],
    limits: { proposals: -1, team: 20, storage: '25GB' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 199, yearly: 1990 },
    features: ['Everything in Business', 'Unlimited team', 'Custom domain', 'SSO/SAML', 'Dedicated support', 'SLA guarantee'],
    limits: { proposals: -1, team: -1, storage: '100GB' },
  },
];

const mockInvoices: Invoice[] = [
  { id: '1', number: 'INV-2026-0012', date: '2026-01-01', dueDate: '2026-01-01', amount: 79, status: 'paid', pdfUrl: '#' },
  { id: '2', number: 'INV-2025-0011', date: '2025-12-01', dueDate: '2025-12-01', amount: 79, status: 'paid', pdfUrl: '#' },
  { id: '3', number: 'INV-2025-0010', date: '2025-11-01', dueDate: '2025-11-01', amount: 79, status: 'paid', pdfUrl: '#' },
];

const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', type: 'card', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2027, isDefault: true },
  { id: '2', type: 'card', brand: 'Mastercard', last4: '8888', expMonth: 6, expYear: 2026, isDefault: false },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function Billing() {
  const { organization } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('business');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(mockInvoices);
      setPaymentMethods(mockPaymentMethods);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const currentPlanData = plans.find((p) => p.id === currentPlan);

  if (isLoading) {
    return <BillingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-brand-red" />
          Billing & Subscription
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your subscription, invoices, and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-brand-red/20 bg-gradient-to-br from-brand-red/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-red text-white">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentPlanData?.name} Plan
                  </h2>
                  <PlanBadge plan={currentPlan} />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {currentPlanData && currentPlanData.price.monthly > 0 ? (
                    <>
                      ${currentPlanData.price.monthly}/month • Renews on Feb 1, 2026
                    </>
                  ) : (
                    <>Free forever</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => window.open('/settings/billing/portal', '_blank')}>
                Manage Subscription
              </Button>
              {currentPlan !== 'enterprise' && (
                <Button onClick={() => setShowUpgradeDialog(true)} leftIcon={<Sparkles className="w-4 h-4" />}>
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Usage Summary */}
          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Proposals This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                24 / {currentPlanData?.limits.proposals === -1 ? '∞' : currentPlanData?.limits.proposals}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                8 / {currentPlanData?.limits.team === -1 ? '∞' : currentPlanData?.limits.team}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                12.4GB / {currentPlanData?.limits.storage}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Compare Plans
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Download invoices for your records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y dark:divide-gray-700">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{invoice.number}</p>
                        <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'past_due' ? 'destructive' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount)}
                      </span>
                      <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="mt-6 space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button variant="ghost" size="sm">Set as Default</Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-600">Remove</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" leftIcon={<CreditCard className="w-4 h-4" />}>
            Add Payment Method
          </Button>
        </TabsContent>

        {/* Plans Comparison Tab */}
        <TabsContent value="plans" className="mt-6">
          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  billingPeriod === 'yearly'
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                Yearly
                <Badge variant="success" className="ml-2">Save 17%</Badge>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                isCurrentPlan={plan.id === currentPlan}
                onSelect={() => {
                  setSelectedPlan(plan.id);
                  setShowUpgradeDialog(true);
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              You're upgrading to {selectedPlan && plans.find((p) => p.id === selectedPlan)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">New monthly price</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ${selectedPlan && plans.find((p) => p.id === selectedPlan)?.price[billingPeriod]}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your card ending in •••• {paymentMethods[0]?.last4} will be charged.
              The prorated amount will be applied to your next invoice.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowUpgradeDialog(false)}>
              Confirm Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PlanCard({
  plan,
  billingPeriod,
  isCurrentPlan,
  onSelect,
}: {
  plan: Plan;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  onSelect: () => void;
}) {
  const price = billingPeriod === 'yearly' ? Math.round(plan.price.yearly / 12) : plan.price.monthly;

  return (
    <Card className={cn(
      'relative',
      plan.popular && 'border-brand-red ring-2 ring-brand-red/20',
      isCurrentPlan && 'bg-gray-50 dark:bg-gray-800/50'
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-brand-red text-white">Most Popular</Badge>
        </div>
      )}
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">${price}</span>
          <span className="text-gray-500">/mo</span>
        </div>
        {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
          <p className="text-sm text-green-600 mt-1">
            Save ${plan.price.monthly * 12 - plan.price.yearly}/year
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          className="w-full mt-6"
          variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
          disabled={isCurrentPlan}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
