/**
 * Sommer's Proposal System - Discount Manager Component
 * Main UI for applying and managing discounts on proposals
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Percent,
  DollarSign,
  Gift,
  Crown,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Users,
  Calendar,
  Shield,
  Loader2,
  Info,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  discountEngine,
  discountCodesService,
  loyaltyService,
  seasonalDiscountService,
} from '@/lib/discounts/discountService';
import type {
  DiscountContext,
  DiscountCalculationResult,
  AppliedDiscount,
  AvailableDiscount,
  DiscountUpsell,
  ActiveSeasonalDiscount,
  CustomerLoyalty,
  ValidateCodeResult,
} from '@/lib/discounts/discountTypes';

// ============================================================================
// MAIN DISCOUNT MANAGER COMPONENT
// ============================================================================

interface DiscountManagerProps {
  context: DiscountContext;
  onDiscountsChange: (result: DiscountCalculationResult) => void;
  showApprovalWorkflow?: boolean;
  allowManualDiscounts?: boolean;
  className?: string;
}

export function DiscountManager({
  context,
  onDiscountsChange,
  showApprovalWorkflow = true,
  allowManualDiscounts = true,
  className,
}: DiscountManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<DiscountCalculationResult | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<ValidateCodeResult | null>(null);
  const [manualDiscountType, setManualDiscountType] = useState<'percent' | 'amount'>('percent');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [showManualForm, setShowManualForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('applied');
  const [seasonalDiscounts, setSeasonalDiscounts] = useState<ActiveSeasonalDiscount[]>([]);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty | null>(null);

  // Calculate discounts when context changes
  const calculateDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build context with current inputs
      const updatedContext: DiscountContext = {
        ...context,
        promoCode: promoSuccess?.code || undefined,
        manualDiscountPercent: manualDiscountType === 'percent' ? manualDiscountValue : undefined,
        manualDiscountAmount: manualDiscountType === 'amount' ? manualDiscountValue : undefined,
      };

      const calculationResult = await discountEngine.calculate(updatedContext);
      setResult(calculationResult);
      onDiscountsChange(calculationResult);
    } catch (error) {
      console.error('Error calculating discounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context, promoSuccess, manualDiscountType, manualDiscountValue, onDiscountsChange]);

  // Initial load
  useEffect(() => {
    calculateDiscounts();
  }, [calculateDiscounts]);

  // Load seasonal discounts and loyalty info
  useEffect(() => {
    const loadExtras = async () => {
      try {
        const [seasonal, loyalty] = await Promise.all([
          seasonalDiscountService.getActive(context.orgId),
          context.clientId ? loyaltyService.getCustomerLoyalty(context.orgId, context.clientId) : null,
        ]);
        setSeasonalDiscounts(seasonal);
        setCustomerLoyalty(loyalty);
      } catch (error) {
        console.error('Error loading discount extras:', error);
      }
    };
    loadExtras();
  }, [context.orgId, context.clientId]);

  // Handle promo code submission
  const handlePromoSubmit = async () => {
    if (!promoCode.trim()) return;

    setPromoError(null);
    setPromoSuccess(null);

    try {
      const result = await discountCodesService.validate(
        context.orgId,
        promoCode.trim(),
        context.clientId,
        context.clientEmail,
        context.subtotal
      );

      if (result.valid) {
        setPromoSuccess(result);
        setPromoCode('');
      } else {
        setPromoError(result.error || 'Invalid code');
      }
    } catch (error) {
      setPromoError('Failed to validate code');
    }
  };

  // Remove promo code
  const handleRemovePromo = () => {
    setPromoSuccess(null);
    calculateDiscounts();
  };

  // Apply manual discount
  const handleApplyManualDiscount = () => {
    if (manualDiscountValue > 0) {
      calculateDiscounts();
      setShowManualForm(false);
    }
  };

  // Clear manual discount
  const handleClearManualDiscount = () => {
    setManualDiscountValue(0);
    calculateDiscounts();
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading && !result) {
    return (
      <div className={cn('p-6 bg-white dark:bg-gray-800 rounded-lg border', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
          <span className="ml-2 text-gray-500">Calculating discounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-red" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Discounts & Savings</h3>
          </div>
          {result && result.totalDiscount > 0 && (
            <div className="flex items-center gap-1 text-green-600 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>-${result.totalDiscount.toFixed(2)} saved</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Seasonal Banner */}
        {seasonalDiscounts.length > 0 && (
          <SeasonalBanner
            discount={seasonalDiscounts[0]}
            onApply={() => calculateDiscounts()}
          />
        )}

        {/* Applied Discounts Section */}
        {result && result.appliedDiscounts.length > 0 && (
          <CollapsibleSection
            title="Applied Discounts"
            icon={<CheckCircle className="w-4 h-4 text-green-500" />}
            badge={`${result.appliedDiscounts.length} active`}
            isExpanded={expandedSection === 'applied'}
            onToggle={() => toggleSection('applied')}
          >
            <div className="space-y-2">
              {result.appliedDiscounts.map((discount, index) => (
                <AppliedDiscountCard
                  key={discount.id}
                  discount={discount}
                  onRemove={
                    discount.sourceType === 'promo_code'
                      ? handleRemovePromo
                      : discount.sourceType === 'manual'
                      ? handleClearManualDiscount
                      : undefined
                  }
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Promo Code Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Promo Code
          </label>
          {promoSuccess ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  {promoSuccess.code}
                </span>
                <span className="text-sm text-green-600 dark:text-green-500">
                  (-${promoSuccess.discountAmount?.toFixed(2)})
                </span>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-green-600 hover:text-green-800 dark:text-green-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., SUMMER10)"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                onKeyDown={(e) => e.key === 'Enter' && handlePromoSubmit()}
              />
              <button
                onClick={handlePromoSubmit}
                disabled={!promoCode.trim()}
                className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}
          {promoError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {promoError}
            </p>
          )}
        </div>

        {/* Manual Discount */}
        {allowManualDiscounts && (
          <div className="space-y-2">
            {showManualForm ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Manual Discount
                  </label>
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Type Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setManualDiscountType('percent')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-1',
                      manualDiscountType === 'percent'
                        ? 'border-brand-red bg-brand-red/5 text-brand-red'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <Percent className="w-4 h-4" />
                    Percentage
                  </button>
                  <button
                    onClick={() => setManualDiscountType('amount')}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-1',
                      manualDiscountType === 'amount'
                        ? 'border-brand-red bg-brand-red/5 text-brand-red'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <DollarSign className="w-4 h-4" />
                    Fixed Amount
                  </button>
                </div>

                {/* Value Input */}
                <div className="relative">
                  {manualDiscountType === 'amount' && (
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                  <input
                    type="number"
                    value={manualDiscountValue || ''}
                    onChange={(e) =>
                      setManualDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder={manualDiscountType === 'percent' ? '0' : '0.00'}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red',
                      manualDiscountType === 'amount' && 'pl-8'
                    )}
                    max={manualDiscountType === 'percent' ? 100 : context.subtotal}
                  />
                  {manualDiscountType === 'percent' && (
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Preview */}
                {manualDiscountValue > 0 && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Estimated savings:{' '}
                      <strong>
                        $
                        {manualDiscountType === 'percent'
                          ? (context.subtotal * (manualDiscountValue / 100)).toFixed(2)
                          : manualDiscountValue.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Approval Warning */}
                {result?.requiresApproval && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      <strong>Approval Required:</strong> {result.approvalReason}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleApplyManualDiscount}
                  disabled={manualDiscountValue <= 0}
                  className="w-full py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Discount
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-brand-red hover:text-brand-red transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Manual Discount
              </button>
            )}
          </div>
        )}

        {/* Loyalty Widget */}
        {customerLoyalty && (
          <LoyaltyWidget
            loyalty={customerLoyalty}
            subtotal={context.subtotal}
            onRedeemPoints={(points) => {
              // TODO: Implement points redemption
              console.log('Redeem points:', points);
            }}
          />
        )}

        {/* Available Discounts */}
        {result && result.availableDiscounts.length > 0 && (
          <CollapsibleSection
            title="Available Discounts"
            icon={<Gift className="w-4 h-4 text-purple-500" />}
            badge={`${result.availableDiscounts.filter((d) => d.canApply).length} available`}
            isExpanded={expandedSection === 'available'}
            onToggle={() => toggleSection('available')}
          >
            <div className="space-y-2">
              {result.availableDiscounts
                .filter((d) => !result.appliedDiscounts.some((a) => a.sourceId === d.sourceId))
                .map((discount) => (
                  <AvailableDiscountCard key={discount.sourceId} discount={discount} />
                ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Upsell Suggestions */}
        {result && result.upsellSuggestions.length > 0 && (
          <CollapsibleSection
            title="Ways to Save More"
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            badge={`${result.upsellSuggestions.length} suggestions`}
            isExpanded={expandedSection === 'upsell'}
            onToggle={() => toggleSection('upsell')}
          >
            <div className="space-y-2">
              {result.upsellSuggestions.map((suggestion, index) => (
                <UpsellCard key={index} suggestion={suggestion} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Summary */}
        {result && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Original Subtotal</span>
              <span>${result.originalSubtotal.toFixed(2)}</span>
            </div>
            {result.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Total Savings</span>
                <span>-${result.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
              <span>Discounted Subtotal</span>
              <span>${result.finalSubtotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUPPORTING COMPONENTS
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  badge,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="p-4 bg-white dark:bg-gray-800">{children}</div>}
    </div>
  );
}

interface AppliedDiscountCardProps {
  discount: AppliedDiscount;
  onRemove?: () => void;
}

function AppliedDiscountCard({ discount, onRemove }: AppliedDiscountCardProps) {
  const getSourceIcon = () => {
    switch (discount.sourceType) {
      case 'promo_code':
        return <Tag className="w-4 h-4 text-blue-500" />;
      case 'loyalty':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'volume':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'automatic_rule':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Percent className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <div className="flex items-center gap-3">
        {getSourceIcon()}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{discount.sourceName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {discount.discountType === 'percent'
              ? `${discount.discountValue}% off`
              : `$${discount.discountValue.toFixed(2)} off`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-green-600 dark:text-green-400">
          -${discount.discountAmount.toFixed(2)}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface AvailableDiscountCardProps {
  discount: AvailableDiscount;
}

function AvailableDiscountCard({ discount }: AvailableDiscountCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <Gift className="w-4 h-4 text-purple-500" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{discount.name}</div>
          {discount.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400">{discount.description}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-purple-600 dark:text-purple-400">
          Save ${discount.estimatedSavings.toFixed(2)}
        </div>
        {!discount.canApply && discount.reason && (
          <div className="text-xs text-gray-400">{discount.reason}</div>
        )}
      </div>
    </div>
  );
}

interface SeasonalBannerProps {
  discount: ActiveSeasonalDiscount;
  onApply?: () => void;
}

function SeasonalBanner({ discount, onApply }: SeasonalBannerProps) {
  return (
    <div
      className="p-4 rounded-lg text-white relative overflow-hidden"
      style={{ backgroundColor: discount.bannerColor }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5" />
          <span className="font-bold">{discount.name}</span>
        </div>
        {discount.bannerText && <p className="text-sm opacity-90">{discount.bannerText}</p>}
        {discount.showCountdown && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4" />
            <span>
              Ends in {discount.timeRemaining.days}d {discount.timeRemaining.hours}h{' '}
              {discount.timeRemaining.minutes}m
            </span>
          </div>
        )}
      </div>
      {/* Decorative pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Sparkles className="w-full h-full" />
      </div>
    </div>
  );
}

interface LoyaltyWidgetProps {
  loyalty: CustomerLoyalty;
  subtotal: number;
  onRedeemPoints?: (points: number) => void;
}

function LoyaltyWidget({ loyalty, subtotal, onRedeemPoints }: LoyaltyWidgetProps) {
  const [redeemAmount, setRedeemAmount] = useState(0);

  const getTierColor = () => {
    switch (loyalty.currentTier.toLowerCase()) {
      case 'platinum':
        return 'from-gray-700 to-gray-900';
      case 'gold':
        return 'from-yellow-500 to-yellow-700';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-amber-600 to-amber-800';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Tier Header */}
      <div className={cn('p-4 bg-gradient-to-r text-white', getTierColor())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <span className="font-bold">{loyalty.currentTier} Member</span>
          </div>
          {loyalty.tierDiscountPercent > 0 && (
            <span className="px-2 py-1 bg-white/20 rounded text-sm">
              {loyalty.tierDiscountPercent}% off always
            </span>
          )}
        </div>
      </div>

      {/* Points Info */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 dark:text-gray-400">Available Points</span>
          <span className="text-2xl font-bold text-brand-red">
            {loyalty.currentPoints.toLocaleString()}
          </span>
        </div>

        {loyalty.currentPoints >= 500 && onRedeemPoints && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Redeem points (100 pts = $1)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={redeemAmount || ''}
                onChange={(e) =>
                  setRedeemAmount(Math.min(loyalty.currentPoints, parseInt(e.target.value) || 0))
                }
                placeholder="Points to redeem"
                className="flex-1 px-3 py-2 border rounded-lg"
                step={100}
                min={0}
                max={loyalty.currentPoints}
              />
              <button
                onClick={() => onRedeemPoints(redeemAmount)}
                disabled={redeemAmount < 500}
                className="px-4 py-2 bg-brand-red text-white rounded-lg disabled:opacity-50"
              >
                Redeem
              </button>
            </div>
            {redeemAmount >= 500 && (
              <p className="text-sm text-green-600">
                = ${(redeemAmount * 0.01).toFixed(2)} discount
              </p>
            )}
          </div>
        )}

        {/* Referral Code */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>Your referral code:</span>
            </div>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
              {loyalty.referralCode}
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {loyalty.referralsCount} referrals • Earn 500 pts per referral
          </p>
        </div>
      </div>
    </div>
  );
}

interface UpsellCardProps {
  suggestion: DiscountUpsell;
}

function UpsellCard({ suggestion }: UpsellCardProps) {
  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'volume':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'combo':
        return <Gift className="w-4 h-4 text-purple-500" />;
      case 'loyalty':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getTypeIcon()}</div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{suggestion.message}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {suggestion.actionRequired}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Save up to ${suggestion.potentialSavings.toFixed(2)}
            </span>
            <button className="text-sm text-brand-red hover:underline">{suggestion.ctaText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SeasonalBanner,
  LoyaltyWidget,
  AppliedDiscountCard,
  AvailableDiscountCard,
  UpsellCard,
};
