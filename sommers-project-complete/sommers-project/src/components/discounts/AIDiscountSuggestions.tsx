/**
 * Sommer's Proposal System - AI Discount Suggestions
 * Smart discount recommendations based on deal context
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  DollarSign,
  Percent,
  Clock,
  Users,
  Calendar,
  ChevronRight,
  Check,
  X,
  Loader2,
  Crown,
  Gift,
  Tag,
  BarChart3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface DealContext {
  // Proposal info
  subtotal: number;
  services: { type: string; quantity: number; unit: string }[];
  tier: 'economy' | 'standard' | 'premium';
  
  // Client info
  clientId?: string;
  isNewCustomer: boolean;
  clientLifetimeValue?: number;
  clientTotalOrders?: number;
  lastOrderDate?: string;
  
  // Deal context
  competitorMentioned?: boolean;
  urgencyLevel?: 'low' | 'medium' | 'high';
  seasonalContext?: string;
  referralSource?: string;
  
  // Historical data
  averageDiscountGiven?: number;
  winRateAtPrice?: number;
  competitorPricing?: number;
}

export interface DiscountSuggestion {
  id: string;
  type: 'promo_code' | 'manual' | 'loyalty' | 'volume' | 'seasonal' | 'competitive';
  title: string;
  description: string;
  reasoning: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  estimatedSavings: number;
  confidence: 'low' | 'medium' | 'high';
  winProbabilityImpact: number; // +X% to win rate
  priority: number;
  conditions?: string[];
  promoCode?: string;
  expiresIn?: string;
}

interface AIDiscountSuggestionsProps {
  context: DealContext;
  onApplySuggestion: (suggestion: DiscountSuggestion) => void;
  className?: string;
}

// ============================================================================
// AI DISCOUNT SUGGESTIONS COMPONENT
// ============================================================================

export function AIDiscountSuggestions({
  context,
  onApplySuggestion,
  className,
}: AIDiscountSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<DiscountSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Generate AI suggestions based on context
  useEffect(() => {
    const generateSuggestions = async () => {
      setIsLoading(true);

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newSuggestions: DiscountSuggestion[] = [];

      // 1. New Customer Discount
      if (context.isNewCustomer) {
        newSuggestions.push({
          id: 'new-customer',
          type: 'promo_code',
          title: 'First-Time Customer Discount',
          description: '10% off their first project to build a long-term relationship',
          reasoning:
            'New customers who receive a welcome discount have 40% higher retention rates. This client has no order history with us.',
          discountType: 'percent',
          discountValue: 10,
          estimatedSavings: context.subtotal * 0.1,
          confidence: 'high',
          winProbabilityImpact: 15,
          priority: 1,
          promoCode: 'WELCOME10',
          conditions: ['First order only', 'Cannot combine with other offers'],
        });
      }

      // 2. Volume-Based Suggestion
      const totalSqft = context.services
        .filter((s) => s.unit === 'sqft')
        .reduce((sum, s) => sum + s.quantity, 0);

      if (totalSqft >= 8000 && totalSqft < 10000) {
        const additionalSqft = 10000 - totalSqft;
        newSuggestions.push({
          id: 'volume-upsell',
          type: 'volume',
          title: 'Volume Discount Opportunity',
          description: `Add ${additionalSqft.toLocaleString()} more sq ft to unlock 10% volume discount`,
          reasoning: `Current project is ${totalSqft.toLocaleString()} sq ft. At 10,000+ sq ft, volume pricing kicks in. Suggest expanding scope or offering the discount proactively to close the deal.`,
          discountType: 'percent',
          discountValue: 10,
          estimatedSavings: context.subtotal * 0.1,
          confidence: 'medium',
          winProbabilityImpact: 8,
          priority: 2,
          conditions: ['Minimum 10,000 sq ft', 'Stackable with loyalty'],
        });
      } else if (totalSqft >= 10000) {
        newSuggestions.push({
          id: 'volume-qualified',
          type: 'volume',
          title: 'Volume Discount Qualified',
          description: 'This project qualifies for automatic 10% volume discount',
          reasoning: `At ${totalSqft.toLocaleString()} sq ft, this project exceeds the 10,000 sq ft threshold for volume pricing.`,
          discountType: 'percent',
          discountValue: 10,
          estimatedSavings: context.subtotal * 0.1,
          confidence: 'high',
          winProbabilityImpact: 5,
          priority: 1,
        });
      }

      // 3. Returning Customer Loyalty
      if (!context.isNewCustomer && context.clientTotalOrders && context.clientTotalOrders >= 3) {
        const loyaltyDiscount = Math.min(15, 5 + context.clientTotalOrders);
        newSuggestions.push({
          id: 'loyalty-reward',
          type: 'loyalty',
          title: 'Loyalty Reward',
          description: `${loyaltyDiscount}% loyalty discount for valued repeat customer`,
          reasoning: `This client has ${context.clientTotalOrders} previous orders worth $${(context.clientLifetimeValue || 0).toLocaleString()}. Rewarding loyalty strengthens the relationship and increases lifetime value.`,
          discountType: 'percent',
          discountValue: loyaltyDiscount,
          estimatedSavings: context.subtotal * (loyaltyDiscount / 100),
          confidence: 'high',
          winProbabilityImpact: 20,
          priority: 1,
        });
      }

      // 4. Competitive Pressure Response
      if (context.competitorMentioned) {
        newSuggestions.push({
          id: 'competitive-match',
          type: 'competitive',
          title: 'Competitive Response',
          description: 'Match or beat competitor pricing to win the deal',
          reasoning:
            'Client mentioned getting other quotes. A strategic discount of 8-12% typically wins competitive situations while maintaining margins.',
          discountType: 'percent',
          discountValue: 10,
          estimatedSavings: context.subtotal * 0.1,
          confidence: 'medium',
          winProbabilityImpact: 25,
          priority: 1,
          conditions: ['Requires manager approval', 'Document competitor quote'],
        });
      }

      // 5. Seasonal Promotion
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 2 && currentMonth <= 4) {
        // Spring (March-May)
        newSuggestions.push({
          id: 'seasonal-spring',
          type: 'seasonal',
          title: 'Spring Booking Special',
          description: '15% off for scheduling spring service',
          reasoning:
            'Spring is peak season for asphalt maintenance. Early bookings help with crew scheduling and cash flow. Limited-time offer creates urgency.',
          discountType: 'percent',
          discountValue: 15,
          estimatedSavings: context.subtotal * 0.15,
          confidence: 'high',
          winProbabilityImpact: 18,
          priority: 2,
          promoCode: 'SPRING15',
          expiresIn: '7 days',
        });
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        // Fall (Oct-Dec)
        newSuggestions.push({
          id: 'seasonal-fall',
          type: 'seasonal',
          title: 'End of Season Special',
          description: '12% off for booking before winter',
          reasoning:
            'Filling the schedule before winter slowdown. Discounting now ensures revenue and keeps crews busy.',
          discountType: 'percent',
          discountValue: 12,
          estimatedSavings: context.subtotal * 0.12,
          confidence: 'high',
          winProbabilityImpact: 15,
          priority: 2,
          promoCode: 'FALL12',
          expiresIn: '14 days',
        });
      }

      // 6. High-Value Deal Strategy
      if (context.subtotal >= 15000) {
        newSuggestions.push({
          id: 'high-value-close',
          type: 'manual',
          title: 'High-Value Deal Closer',
          description: 'Strategic discount to close large commercial project',
          reasoning: `This $${context.subtotal.toLocaleString()} deal represents significant revenue. A 7% discount loses $${(context.subtotal * 0.07).toLocaleString()} but secures the contract. ROI is positive if win probability increases by more than 7%.`,
          discountType: 'percent',
          discountValue: 7,
          estimatedSavings: context.subtotal * 0.07,
          confidence: 'medium',
          winProbabilityImpact: 12,
          priority: 2,
          conditions: ['Requires manager approval for discounts over $1,000'],
        });
      }

      // 7. Urgency-Based Suggestion
      if (context.urgencyLevel === 'high') {
        newSuggestions.push({
          id: 'quick-decision',
          type: 'promo_code',
          title: 'Quick Decision Bonus',
          description: '5% additional discount for signing within 48 hours',
          reasoning:
            'High-urgency deals benefit from time-limited offers. Creates immediate action and prevents shopping around.',
          discountType: 'percent',
          discountValue: 5,
          estimatedSavings: context.subtotal * 0.05,
          confidence: 'medium',
          winProbabilityImpact: 22,
          priority: 1,
          promoCode: 'QUICK5',
          expiresIn: '48 hours',
        });
      }

      // 8. Service Bundle Suggestion
      const hasSealing = context.services.some((s) => s.type === 'sealcoating');
      const hasCrackFill = context.services.some((s) => s.type === 'crack_filling');
      
      if (hasSealing && !hasCrackFill) {
        newSuggestions.push({
          id: 'bundle-upsell',
          type: 'manual',
          title: 'Bundle & Save Suggestion',
          description: 'Add crack filling for 8% off entire project',
          reasoning:
            'Crack filling before sealing extends pavement life 30%+. Bundling services increases average order value and customer satisfaction.',
          discountType: 'percent',
          discountValue: 8,
          estimatedSavings: context.subtotal * 0.08,
          confidence: 'high',
          winProbabilityImpact: 10,
          priority: 3,
          conditions: ['Must add crack filling service', 'Applied to total'],
        });
      }

      // Sort by priority
      newSuggestions.sort((a, b) => a.priority - b.priority);

      setSuggestions(newSuggestions);
      setIsLoading(false);
    };

    generateSuggestions();
  }, [context]);

  // Handle apply suggestion
  const handleApply = (suggestion: DiscountSuggestion) => {
    setAppliedSuggestions((prev) => new Set([...prev, suggestion.id]));
    onApplySuggestion(suggestion);
  };

  // Handle dismiss suggestion
  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, suggestionId]));
  };

  // Get confidence badge color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promo_code':
        return <Tag className="w-4 h-4" />;
      case 'loyalty':
        return <Crown className="w-4 h-4" />;
      case 'volume':
        return <TrendingUp className="w-4 h-4" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4" />;
      case 'competitive':
        return <Target className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s.id)
  );

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border p-6', className)}>
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing deal context for smart discount suggestions...</span>
        </div>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border p-6', className)}>
        <div className="flex items-center gap-3 text-gray-500">
          <Sparkles className="w-5 h-5" />
          <span>No discount suggestions for this deal context</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Discount Suggestions</h3>
          <span className="ml-auto text-sm opacity-80">
            {visibleSuggestions.length} recommendation{visibleSuggestions.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {visibleSuggestions.map((suggestion) => {
          const isExpanded = expandedSuggestion === suggestion.id;
          const isApplied = appliedSuggestions.has(suggestion.id);

          return (
            <div
              key={suggestion.id}
              className={cn(
                'transition-colors',
                isApplied && 'bg-green-50 dark:bg-green-900/20'
              )}
            >
              {/* Main Row */}
              <div
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      suggestion.type === 'loyalty' && 'bg-yellow-100 text-yellow-600',
                      suggestion.type === 'volume' && 'bg-green-100 text-green-600',
                      suggestion.type === 'promo_code' && 'bg-blue-100 text-blue-600',
                      suggestion.type === 'seasonal' && 'bg-orange-100 text-orange-600',
                      suggestion.type === 'competitive' && 'bg-red-100 text-red-600',
                      suggestion.type === 'manual' && 'bg-purple-100 text-purple-600'
                    )}
                  >
                    {getTypeIcon(suggestion.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h4>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getConfidenceColor(suggestion.confidence)
                        )}
                      >
                        {suggestion.confidence} confidence
                      </span>
                      {isApplied && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Applied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {suggestion.description}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-green-600 font-medium">
                        Save ${suggestion.estimatedSavings.toFixed(0)}
                      </span>
                      <span className="text-blue-600">
                        +{suggestion.winProbabilityImpact}% win rate
                      </span>
                      {suggestion.expiresIn && (
                        <span className="text-orange-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {suggestion.expiresIn}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <ChevronRight
                    className={cn(
                      'w-5 h-5 text-gray-400 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-700/50">
                  {/* AI Reasoning */}
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-1">
                      <Lightbulb className="w-4 h-4" />
                      AI Reasoning
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Conditions */}
                  {suggestion.conditions && suggestion.conditions.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <Info className="w-3 h-3" />
                        Conditions
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {suggestion.conditions.map((condition, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Promo Code Display */}
                  {suggestion.promoCode && (
                    <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Promo Code:
                      </span>
                      <code className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded font-mono font-bold text-blue-800 dark:text-blue-200">
                        {suggestion.promoCode}
                      </code>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isApplied ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(suggestion);
                          }}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Apply{' '}
                          {suggestion.discountType === 'percent'
                            ? `${suggestion.discountValue}%`
                            : `$${suggestion.discountValue}`}{' '}
                          Discount
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(suggestion.id);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Discount Applied</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {appliedSuggestions.size} of {suggestions.length} applied
          </span>
          <div className="flex items-center gap-4">
            <span className="text-green-600">
              Total savings: $
              {suggestions
                .filter((s) => appliedSuggestions.has(s.id))
                .reduce((sum, s) => sum + s.estimatedSavings, 0)
                .toFixed(0)}
            </span>
            <span className="text-blue-600">
              +
              {suggestions
                .filter((s) => appliedSuggestions.has(s.id))
                .reduce((sum, s) => sum + s.winProbabilityImpact, 0)}
              % win rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIDiscountSuggestions;
