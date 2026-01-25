/**
 * Sommer's Proposal System - Wizard Step Review
 * Final review step with integrated discount management
 */

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Building2,
  User,
  Ruler,
  ShoppingCart,
  DollarSign,
  Calendar,
  Settings,
  Edit2,
  Check,
  AlertTriangle,
  Percent,
  Receipt,
  Clock,
  FileSignature,
  CreditCard,
  Tag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crown,
  TrendingUp,
  Gift,
  Info,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposalStore } from '@/stores/proposalStore';
import { DiscountManager } from '@/components/discounts/DiscountManager';
import { useDiscounts } from '@/lib/discounts/useDiscounts';
import type { DiscountCalculationResult, DiscountContext } from '@/lib/discounts/discountTypes';

interface WizardStepReviewProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStepReview({ onNext, onBack }: WizardStepReviewProps) {
  const {
    formData,
    setFormData,
    setCurrentStep,
    pricing,
    calculatePricing,
    selectedServices,
    generateProposalName,
  } = useProposalStore();

  const [showDiscountSection, setShowDiscountSection] = useState(true);
  const [discountResult, setDiscountResult] = useState<DiscountCalculationResult | null>(null);
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  // Build discount context from proposal data
  const discountContext: DiscountContext = useMemo(
    () => ({
      orgId: formData.orgId || '',
      proposalId: formData.id,
      subtotal: pricing?.selectedSubtotal || 0,
      services: selectedServices.map((service) => ({
        type: service.type,
        name: service.name,
        quantity: service.quantity || 0,
        unit: service.unit || 'sqft',
        subtotal: service.total || 0,
      })),
      tier: formData.selectedTier || 'standard',
      clientId: formData.clientId,
      clientEmail: formData.clientEmail,
      isNewCustomer: !formData.isReturningClient,
      clientTotalOrders: formData.clientPreviousOrders,
      clientLifetimeValue: formData.clientLifetimeValue,
      loyaltyPoints: formData.clientLoyaltyPoints,
      loyaltyTier: formData.clientLoyaltyTier,
      userId: formData.createdBy || '',
      userRole: formData.userRole || 'sales',
    }),
    [formData, pricing, selectedServices]
  );

  // Handle discount changes
  const handleDiscountsChange = (result: DiscountCalculationResult) => {
    setDiscountResult(result);

    // Update form data with discount info
    setFormData({
      ...formData,
      appliedDiscounts: result.appliedDiscounts,
      totalDiscount: result.totalDiscount,
      discountedSubtotal: result.finalSubtotal,
      requiresDiscountApproval: result.requiresApproval,
      discountApprovalReason: result.approvalReason,
    });

    // Recalculate pricing with new discount
    calculatePricing();
  };

  // Calculate final totals
  const finalPricing = useMemo(() => {
    const subtotal = pricing?.selectedSubtotal || 0;
    const discount = discountResult?.totalDiscount || formData.totalDiscount || 0;
    const discountedSubtotal = subtotal - discount;
    const taxAmount = formData.includeTax ? discountedSubtotal * (formData.taxRate / 100) : 0;
    const total = discountedSubtotal + taxAmount;
    const depositAmount = formData.requireDeposit ? total * (formData.depositPercent / 100) : 0;

    return {
      subtotal,
      discount,
      discountedSubtotal,
      taxAmount,
      total,
      depositAmount,
      balanceDue: total - depositAmount,
    };
  }, [pricing, discountResult, formData]);

  // Generate proposal name on mount
  useEffect(() => {
    if (!formData.proposalName) {
      setIsGeneratingName(true);
      const name = generateProposalName();
      setFormData({ ...formData, proposalName: name });
      setIsGeneratingName(false);
    }
  }, []);

  // Get property type label
  const propertyTypeLabel =
    formData.propertyType === 'residential'
      ? 'Residential'
      : formData.propertyType === 'commercial'
      ? 'Commercial'
      : formData.propertyType;

  // Section card component
  const SectionCard = ({
    icon: Icon,
    title,
    stepIndex,
    children,
    className,
  }: {
    icon: React.ElementType;
    title: string;
    stepIndex?: number;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border overflow-hidden', className)}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-red" />
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        {stepIndex !== undefined && (
          <button
            onClick={() => setCurrentStep(stepIndex)}
            className="text-sm text-brand-red hover:underline flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  // Detail row component
  const DetailRow = ({
    label,
    value,
    className,
  }: {
    label: string;
    value: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn('flex justify-between py-1', className)}>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Proposal</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review all details, apply discounts, and prepare for delivery
        </p>
      </div>

      {/* Approval Warning */}
      {discountResult?.requiresApproval && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                Approval Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {discountResult.approvalReason}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                This proposal will be sent for manager approval before delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Name */}
          <SectionCard icon={FileText} title="Proposal Details">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proposal Name
                </label>
                <input
                  type="text"
                  value={formData.proposalName || ''}
                  onChange={(e) => setFormData({ ...formData, proposalName: e.target.value })}
                  placeholder="Enter proposal name..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                />
              </div>
              <DetailRow label="Created" value={new Date().toLocaleDateString()} />
              <DetailRow
                label="Valid Until"
                value={
                  formData.validUntil
                    ? new Date(formData.validUntil).toLocaleDateString()
                    : '30 days from creation'
                }
              />
            </div>
          </SectionCard>

          {/* Client Info */}
          <SectionCard icon={User} title="Client Information" stepIndex={0}>
            <div className="space-y-2">
              <DetailRow label="Name" value={formData.clientName || '—'} />
              <DetailRow label="Email" value={formData.clientEmail || '—'} />
              <DetailRow label="Phone" value={formData.clientPhone || '—'} />
              <DetailRow label="Company" value={formData.clientCompany || '—'} />
              {formData.isReturningClient && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Crown className="w-4 h-4" />
                  <span>
                    Returning Customer
                    {formData.clientLoyaltyTier && ` • ${formData.clientLoyaltyTier} Member`}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Property Info */}
          <SectionCard icon={Building2} title="Property Details" stepIndex={1}>
            <div className="space-y-2">
              <DetailRow label="Type" value={propertyTypeLabel} />
              <DetailRow label="Address" value={formData.propertyAddress || '—'} />
              <DetailRow
                label="Surface Condition"
                value={
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-sm',
                      formData.surfaceCondition === 'good' && 'bg-green-100 text-green-700',
                      formData.surfaceCondition === 'fair' && 'bg-yellow-100 text-yellow-700',
                      formData.surfaceCondition === 'poor' && 'bg-red-100 text-red-700'
                    )}
                  >
                    {formData.surfaceCondition?.charAt(0).toUpperCase() +
                      formData.surfaceCondition?.slice(1) || 'Not specified'}
                  </span>
                }
              />
            </div>
          </SectionCard>

          {/* Measurements */}
          <SectionCard icon={Ruler} title="Measurements" stepIndex={2}>
            <div className="grid grid-cols-2 gap-4">
              {formData.measurements?.grossSqft && (
                <DetailRow
                  label="Total Area"
                  value={`${formData.measurements.grossSqft.toLocaleString()} sq ft`}
                />
              )}
              {formData.measurements?.crackLinearFeet && (
                <DetailRow
                  label="Crack Length"
                  value={`${formData.measurements.crackLinearFeet.toLocaleString()} LF`}
                />
              )}
              {formData.measurements?.parkingSpaces && (
                <DetailRow label="Parking Spaces" value={formData.measurements.parkingSpaces} />
              )}
              {formData.measurements?.handicapStalls && (
                <DetailRow label="ADA Stalls" value={formData.measurements.handicapStalls} />
              )}
            </div>
          </SectionCard>

          {/* Services */}
          <SectionCard icon={ShoppingCart} title="Selected Services" stepIndex={3}>
            <div className="space-y-3">
              {selectedServices.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">
                      {service.quantity?.toLocaleString()} {service.unit} × ${service.unitPrice?.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${service.total?.toFixed(2)}</div>
                  </div>
                </div>
              ))}

              {selectedServices.length === 0 && (
                <p className="text-gray-500 text-center py-4">No services selected</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Column - Pricing & Discounts */}
        <div className="space-y-6">
          {/* Tier Selection */}
          <SectionCard icon={Settings} title="Pricing Tier">
            <div className="grid grid-cols-3 gap-2">
              {(['economy', 'standard', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFormData({ ...formData, selectedTier: tier })}
                  className={cn(
                    'py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors',
                    formData.selectedTier === tier
                      ? 'border-brand-red bg-brand-red/5 text-brand-red'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {formData.selectedTier === 'economy' && '0.85x multiplier - Budget option'}
              {formData.selectedTier === 'standard' && '1.0x multiplier - Standard pricing'}
              {formData.selectedTier === 'premium' && '1.35x multiplier - Premium service'}
            </p>
          </SectionCard>

          {/* ===== DISCOUNT MANAGER INTEGRATION ===== */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
            <button
              onClick={() => setShowDiscountSection(!showDiscountSection)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-red" />
                <span className="font-medium text-gray-900 dark:text-white">Discounts & Savings</span>
                {discountResult && discountResult.totalDiscount > 0 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    -${discountResult.totalDiscount.toFixed(2)}
                  </span>
                )}
              </div>
              {showDiscountSection ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showDiscountSection && (
              <DiscountManager
                context={discountContext}
                onDiscountsChange={handleDiscountsChange}
                showApprovalWorkflow={true}
                allowManualDiscounts={true}
                className="border-0 rounded-none"
              />
            )}
          </div>

          {/* Final Pricing Summary */}
          <SectionCard icon={DollarSign} title="Pricing Summary">
            <div className="space-y-3">
              <DetailRow
                label="Subtotal"
                value={`$${finalPricing.subtotal.toFixed(2)}`}
              />

              {finalPricing.discount > 0 && (
                <DetailRow
                  label="Discounts"
                  value={
                    <span className="text-green-600">
                      -${finalPricing.discount.toFixed(2)}
                    </span>
                  }
                  className="text-green-600"
                />
              )}

              {finalPricing.discount > 0 && (
                <DetailRow
                  label="Discounted Subtotal"
                  value={`$${finalPricing.discountedSubtotal.toFixed(2)}`}
                />
              )}

              {formData.includeTax && (
                <DetailRow
                  label={`Tax (${formData.taxRate}%)`}
                  value={`$${finalPricing.taxAmount.toFixed(2)}`}
                />
              )}

              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand-red">
                    ${finalPricing.total.toFixed(2)}
                  </span>
                </div>

                {finalPricing.discount > 0 && (
                  <div className="text-sm text-green-600 text-right mt-1">
                    You save ${finalPricing.discount.toFixed(2)} (
                    {((finalPricing.discount / finalPricing.subtotal) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>

              {formData.requireDeposit && (
                <div className="pt-3 border-t space-y-2">
                  <DetailRow
                    label={`Deposit (${formData.depositPercent}%)`}
                    value={`$${finalPricing.depositAmount.toFixed(2)}`}
                  />
                  <DetailRow
                    label="Balance Due"
                    value={`$${finalPricing.balanceDue.toFixed(2)}`}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Payment Options */}
          <SectionCard icon={CreditCard} title="Payment Options">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.requireDeposit}
                  onChange={(e) =>
                    setFormData({ ...formData, requireDeposit: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-red"
                />
                <div>
                  <span className="font-medium">Require Deposit</span>
                  <p className="text-sm text-gray-500">
                    Collect {formData.depositPercent}% upfront
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.acceptOnlinePayment}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptOnlinePayment: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-red"
                />
                <div>
                  <span className="font-medium">Accept Online Payment</span>
                  <p className="text-sm text-gray-500">Via credit card or ACH</p>
                </div>
              </label>
            </div>
          </SectionCard>

          {/* Validity */}
          <SectionCard icon={Clock} title="Validity Period">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proposal Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil || ''}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Applied Discounts Summary */}
      {discountResult && discountResult.appliedDiscounts.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              {discountResult.appliedDiscounts.length} Discount
              {discountResult.appliedDiscounts.length > 1 ? 's' : ''} Applied
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {discountResult.appliedDiscounts.map((discount) => (
              <span
                key={discount.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded-full text-sm"
              >
                {discount.sourceType === 'promo_code' && <Tag className="w-3 h-3" />}
                {discount.sourceType === 'loyalty' && <Crown className="w-3 h-3" />}
                {discount.sourceType === 'volume' && <TrendingUp className="w-3 h-3" />}
                {discount.sourceType === 'seasonal' && <Gift className="w-3 h-3" />}
                {discount.sourceName}: -${discount.discountAmount.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upsell Suggestions */}
      {discountResult && discountResult.upsellSuggestions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800 dark:text-amber-200">Ways to Save More</h4>
          </div>
          <div className="space-y-2">
            {discountResult.upsellSuggestions.slice(0, 2).map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded"
              >
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  {suggestion.message}
                </div>
                <span className="text-sm font-medium text-amber-600">
                  Save ${suggestion.potentialSavings.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back to Services
        </button>

        <button
          onClick={onNext}
          disabled={!formData.proposalName || selectedServices.length === 0}
          className={cn(
            'px-8 py-3 bg-brand-red text-white rounded-lg font-semibold flex items-center gap-2',
            'hover:bg-brand-red/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <FileSignature className="w-5 h-5" />
          {discountResult?.requiresApproval ? 'Submit for Approval' : 'Continue to Signature'}
        </button>
      </div>
    </div>
  );
}
