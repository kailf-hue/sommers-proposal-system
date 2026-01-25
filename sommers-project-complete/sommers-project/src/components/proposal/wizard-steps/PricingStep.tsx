/**
 * Pricing Step - Wizard Step 5
 * Pricing tiers, discounts, and totals
 */

import { DollarSign, Tag, Check, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProposalStore, type PricingTier } from '@/stores/proposalStore';
import { cn, formatCurrency, TIER_MULTIPLIERS, CONDITION_MULTIPLIERS } from '@/lib/utils';

const tiers: Array<{
  id: PricingTier;
  name: string;
  description: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Basic service package',
    features: ['Standard materials', 'Basic warranty', '2-3 day completion'],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Our most popular option',
    features: ['Premium materials', 'Extended warranty', 'Priority scheduling', 'Free touch-ups'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum quality & service',
    features: [
      'Top-tier materials',
      'Lifetime warranty',
      'Next-day start',
      'Free maintenance',
      'Dedicated support',
    ],
  },
];

export default function PricingStep() {
  const { formData, setFormField, pricing } = useProposalStore();

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pricing & Tiers
          </h2>
          <p className="text-sm text-gray-500">
            Select a pricing tier and apply any discounts
          </p>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={cn(
              'relative cursor-pointer transition-all hover:shadow-lg',
              formData.selectedTier === tier.id
                ? 'ring-2 ring-brand-red'
                : 'hover:border-gray-300',
              tier.popular && 'border-blue-500'
            )}
            onClick={() => setFormField('selectedTier', tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
            )}
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {tier.name}
                </h3>
                <p className="text-sm text-gray-500">{tier.description}</p>
              </div>

              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-brand-red">
                  {formatCurrency(pricing.tierPricing[tier.id])}
                </p>
                <p className="text-xs text-gray-500">
                  {TIER_MULTIPLIERS[tier.id]}x base price
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  'w-full py-2 rounded-lg text-center font-medium transition-all',
                  formData.selectedTier === tier.id
                    ? 'bg-brand-red text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                )}
              >
                {formData.selectedTier === tier.id ? 'Selected' : 'Select'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Discounts & Adjustments */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Discounts & Adjustments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tax Rate */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tax Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={(formData.taxRate * 100).toFixed(2)}
                onChange={(e) => setFormField('taxRate', Number(e.target.value) / 100)}
              />
            </div>

            {/* Deposit Percent */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deposit (%)</label>
              <Input
                type="number"
                value={formData.depositPercent}
                onChange={(e) => setFormField('depositPercent', Number(e.target.value))}
              />
            </div>

            {/* Valid Days */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valid For (days)</label>
              <Input
                type="number"
                value={formData.validDays}
                onChange={(e) => setFormField('validDays', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Applied Discounts */}
          {formData.appliedDiscounts.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Applied Discounts</h4>
              <div className="space-y-2">
                {formData.appliedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {discount.sourceName}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      -{formatCurrency(discount.discountAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Pricing Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatCurrency(pricing.subtotal)}
              </span>
            </div>

            {pricing.conditionAdjustment > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Condition Adjustment ({formData.surfaceCondition})
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  +{formatCurrency(pricing.conditionAdjustment)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Tier ({formData.selectedTier})
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {TIER_MULTIPLIERS[formData.selectedTier]}x
              </span>
            </div>

            {pricing.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discounts</span>
                <span>-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax ({(formData.taxRate * 100).toFixed(1)}%)</span>
              <span className="text-gray-900 dark:text-gray-100">
                +{formatCurrency(pricing.taxAmount)}
              </span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Total
                </span>
                <span className="text-2xl font-bold text-brand-red">
                  {formatCurrency(pricing.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Deposit Required</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(pricing.depositAmount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Pricing is calculated based on the selected tier, surface condition, and measurements.
          You can apply discounts from the Discounts page.
        </p>
      </div>
    </div>
  );
}
