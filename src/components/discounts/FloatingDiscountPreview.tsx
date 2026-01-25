/**
 * Sommer's Proposal System - Floating Discount Preview Widget
 * Shows real-time savings as proposal is built
 */

import { useState, useEffect } from 'react';
import {
  Tag,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Crown,
  Gift,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiscounts } from '@/lib/discounts/useDiscounts';
import type { DiscountCalculationResult, ActiveSeasonalDiscount } from '@/lib/discounts/discountTypes';

interface FloatingDiscountPreviewProps {
  subtotal: number;
  services: { type: string; quantity: number; unit: string; subtotal: number }[];
  tier: 'economy' | 'standard' | 'premium';
  clientId?: string;
  clientEmail?: string;
  isNewCustomer?: boolean;
  onApplyDiscount?: () => void;
  onViewDetails?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function FloatingDiscountPreview({
  subtotal,
  services,
  tier,
  clientId,
  clientEmail,
  isNewCustomer = true,
  onApplyDiscount,
  onViewDetails,
  position = 'bottom-right',
}: FloatingDiscountPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false);
  const [prevDiscountCount, setPrevDiscountCount] = useState(0);

  // Use discount hook
  const { result, seasonalDiscounts, customerLoyalty, isLoading } = useDiscounts({
    subtotal,
    services: services.map((s) => ({
      type: s.type,
      name: s.type,
      quantity: s.quantity,
      unit: s.unit,
      subtotal: s.subtotal,
    })),
    tier,
    clientId,
    clientEmail,
    isNewCustomer,
    autoCalculate: true,
  });

  // Check for new suggestions
  useEffect(() => {
    if (result) {
      const currentCount = result.availableDiscounts.length;
      if (currentCount > prevDiscountCount && prevDiscountCount > 0) {
        setHasNewSuggestion(true);
        setTimeout(() => setHasNewSuggestion(false), 3000);
      }
      setPrevDiscountCount(currentCount);
    }
  }, [result, prevDiscountCount]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Calculate potential savings
  const potentialSavings = result?.availableDiscounts.reduce(
    (max, d) => Math.max(max, d.estimatedSavings),
    0
  ) || 0;

  const appliedSavings = result?.totalDiscount || 0;
  const hasAppliedDiscounts = appliedSavings > 0;
  const hasAvailableDiscounts = (result?.availableDiscounts.length || 0) > 0;

  // If minimized, show just a small button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
          'bg-brand-red text-white hover:bg-brand-red/90 transition-all',
          hasNewSuggestion && 'animate-bounce',
          positionClasses[position]
        )}
      >
        <Tag className="w-5 h-5" />
        {hasAvailableDiscounts && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center">
            {result?.availableDiscounts.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border overflow-hidden transition-all duration-300',
        isExpanded ? 'max-h-[500px]' : 'max-h-32',
        hasNewSuggestion && 'ring-2 ring-green-500 ring-offset-2',
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'px-4 py-3 cursor-pointer transition-colors',
          hasAppliedDiscounts
            ? 'bg-green-500 text-white'
            : hasAvailableDiscounts
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasAppliedDiscounts ? (
              <CheckCircle className="w-5 h-5" />
            ) : hasAvailableDiscounts ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <Tag className="w-5 h-5 text-gray-500" />
            )}
            <span className="font-semibold">
              {hasAppliedDiscounts
                ? 'Discounts Applied!'
                : hasAvailableDiscounts
                ? 'Discounts Available'
                : 'No Discounts'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-2 flex items-center justify-between text-sm">
          {hasAppliedDiscounts ? (
            <>
              <span>You're saving</span>
              <span className="font-bold text-lg">-${appliedSavings.toFixed(2)}</span>
            </>
          ) : hasAvailableDiscounts ? (
            <>
              <span>Potential savings</span>
              <span className="font-bold text-lg">Up to ${potentialSavings.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-gray-500">Add more to unlock discounts</span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="overflow-y-auto max-h-[380px]">
          {/* Active Seasonal Banner */}
          {seasonalDiscounts.length > 0 && (
            <div
              className="p-3 text-white text-sm"
              style={{ backgroundColor: seasonalDiscounts[0].bannerColor }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">{seasonalDiscounts[0].name}</span>
              </div>
              {seasonalDiscounts[0].showCountdown && (
                <div className="flex items-center gap-1 mt-1 text-xs opacity-80">
                  <Clock className="w-3 h-3" />
                  Ends in {seasonalDiscounts[0].timeRemaining.days}d{' '}
                  {seasonalDiscounts[0].timeRemaining.hours}h
                </div>
              )}
            </div>
          )}

          {/* Applied Discounts */}
          {result?.appliedDiscounts && result.appliedDiscounts.length > 0 && (
            <div className="p-3 border-b">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Applied</h4>
              <div className="space-y-2">
                {result.appliedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{discount.sourceName}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      -${discount.discountAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Discounts */}
          {result?.availableDiscounts && result.availableDiscounts.length > 0 && (
            <div className="p-3 border-b">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                Available ({result.availableDiscounts.length})
              </h4>
              <div className="space-y-2">
                {result.availableDiscounts.slice(0, 3).map((discount) => (
                  <div
                    key={discount.sourceId}
                    className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {discount.source === 'promo_code' && <Tag className="w-4 h-4 text-purple-500" />}
                      {discount.source === 'loyalty' && <Crown className="w-4 h-4 text-yellow-500" />}
                      {discount.source === 'volume' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {discount.source === 'seasonal' && <Gift className="w-4 h-4 text-orange-500" />}
                      <span className="text-sm">{discount.name}</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600">
                      ${discount.estimatedSavings.toFixed(0)}
                    </span>
                  </div>
                ))}
                {result.availableDiscounts.length > 3 && (
                  <button
                    onClick={onViewDetails}
                    className="w-full text-center text-sm text-purple-600 hover:underline"
                  >
                    +{result.availableDiscounts.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upsell Suggestions */}
          {result?.upsellSuggestions && result.upsellSuggestions.length > 0 && (
            <div className="p-3 border-b bg-amber-50 dark:bg-amber-900/20">
              <h4 className="text-xs font-medium text-amber-700 uppercase mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Unlock More Savings
              </h4>
              {result.upsellSuggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="text-sm text-amber-800 dark:text-amber-200 mb-1">
                  {suggestion.message}
                </div>
              ))}
            </div>
          )}

          {/* Loyalty Info */}
          {customerLoyalty && (
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{customerLoyalty.currentTier} Member</span>
                </div>
                <span className="text-sm text-gray-500">
                  {customerLoyalty.currentPoints.toLocaleString()} pts
                </span>
              </div>
              {customerLoyalty.tierDiscountPercent > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  +{customerLoyalty.tierDiscountPercent}% loyalty discount applied
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {appliedSavings > 0 && (
              <div className="flex justify-between text-sm text-green-600 mb-1">
                <span>Total Savings</span>
                <span>-${appliedSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>After Discounts</span>
              <span>${(subtotal - appliedSavings).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 flex gap-2">
            {hasAvailableDiscounts && !hasAppliedDiscounts && (
              <button
                onClick={onApplyDiscount}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center justify-center gap-1"
              >
                Apply Discounts
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onViewDetails}
              className={cn(
                'py-2 px-4 rounded-lg text-sm font-medium',
                hasAvailableDiscounts && !hasAppliedDiscounts
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-red rounded-full animate-spin" />
            <span className="text-sm">Calculating...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingDiscountPreview;
