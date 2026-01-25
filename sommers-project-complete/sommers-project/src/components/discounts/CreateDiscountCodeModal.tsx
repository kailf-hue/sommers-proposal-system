/**
 * Sommer's Proposal System - Create Discount Code Modal
 * Form for creating new promo codes with all options
 */

import { useState } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { discountCodesService } from '@/lib/discounts/discountService';
import type { CreateDiscountCodeInput, DiscountCode } from '@/lib/discounts/discountTypes';

interface CreateDiscountCodeModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (code: DiscountCode) => void;
}

export function CreateDiscountCodeModal({
  orgId,
  isOpen,
  onClose,
  onCreated,
}: CreateDiscountCodeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<CreateDiscountCodeInput>({
    code: '',
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: 10,
    maxDiscountAmount: undefined,
    minOrderAmount: 0,
    maxUsesTotal: undefined,
    maxUsesPerCustomer: 1,
    applicableServices: undefined,
    applicableTiers: undefined,
    newCustomersOnly: false,
    existingCustomersOnly: false,
    specificCustomerIds: undefined,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: undefined,
  });

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      setError('Code and name are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await discountCodesService.create(orgId, {
        ...formData,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discount code');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-brand-red" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create Promo Code</h2>
              <p className="text-sm text-gray-500">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-brand-red transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Basic Information</h3>
                
                {/* Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Promo Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        }))
                      }
                      placeholder="e.g., SUMMER10"
                      className="flex-1 px-4 py-2 border rounded-lg uppercase font-mono"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Letters and numbers only, max 20 characters
                  </p>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer Sale 10% Off"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Internal notes about this discount..."
                    className="w-full px-4 py-2 border rounded-lg resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Discount Value</h3>

                {/* Discount Type */}
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, discountType: 'percent' }))}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2',
                      formData.discountType === 'percent'
                        ? 'border-brand-red bg-brand-red/5 text-brand-red'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <Percent className="w-4 h-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, discountType: 'fixed' }))}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2',
                      formData.discountType === 'fixed'
                        ? 'border-brand-red bg-brand-red/5 text-brand-red'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <DollarSign className="w-4 h-4" />
                    Fixed Amount
                  </button>
                </div>

                {/* Discount Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {formData.discountType === 'percent' ? 'Percentage' : 'Amount'}
                    </label>
                    <div className="relative">
                      {formData.discountType === 'fixed' && (
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      )}
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountValue: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className={cn(
                          'w-full px-4 py-2 border rounded-lg',
                          formData.discountType === 'fixed' && 'pl-8'
                        )}
                        min={0}
                        max={formData.discountType === 'percent' ? 100 : undefined}
                      />
                      {formData.discountType === 'percent' && (
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {formData.discountType === 'percent' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Discount (Optional)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.maxDiscountAmount || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              maxDiscountAmount: parseFloat(e.target.value) || undefined,
                            }))
                          }
                          placeholder="No limit"
                          className="w-full pl-8 pr-4 py-2 border rounded-lg"
                          min={0}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Cap the maximum discount amount</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Restrictions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Usage Limits</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Uses</label>
                    <input
                      type="number"
                      value={formData.maxUsesTotal || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxUsesTotal: parseInt(e.target.value) || undefined,
                        }))
                      }
                      placeholder="Unlimited"
                      className="w-full px-4 py-2 border rounded-lg"
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Uses Per Customer</label>
                    <input
                      type="number"
                      value={formData.maxUsesPerCustomer}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxUsesPerCustomer: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Order Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.minOrderAmount || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          minOrderAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border rounded-lg"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Customer Restrictions</h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="customerType"
                      checked={!formData.newCustomersOnly && !formData.existingCustomersOnly}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newCustomersOnly: false,
                          existingCustomersOnly: false,
                        }))
                      }
                      className="w-4 h-4 text-brand-red"
                    />
                    <div>
                      <span className="font-medium">All Customers</span>
                      <p className="text-sm text-gray-500">Anyone can use this code</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="customerType"
                      checked={formData.newCustomersOnly}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newCustomersOnly: true,
                          existingCustomersOnly: false,
                        }))
                      }
                      className="w-4 h-4 text-brand-red"
                    />
                    <div>
                      <span className="font-medium">New Customers Only</span>
                      <p className="text-sm text-gray-500">First-time customers only</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="customerType"
                      checked={formData.existingCustomersOnly}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newCustomersOnly: false,
                          existingCustomersOnly: true,
                        }))
                      }
                      className="w-4 h-4 text-brand-red"
                    />
                    <div>
                      <span className="font-medium">Existing Customers Only</span>
                      <p className="text-sm text-gray-500">Returning customers only</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Service & Tier Restrictions (Optional)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Applicable Services</label>
                    <div className="space-y-2">
                      {['sealcoating', 'crack_filling', 'line_striping', 'pothole_repair'].map(
                        (service) => (
                          <label key={service} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.applicableServices?.includes(service) ?? false}
                              onChange={(e) => {
                                const services = formData.applicableServices || [];
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    applicableServices: [...services, service],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    applicableServices: services.filter((s) => s !== service),
                                  }));
                                }
                              }}
                              className="w-4 h-4 rounded text-brand-red"
                            />
                            <span className="text-sm capitalize">{service.replace(/_/g, ' ')}</span>
                          </label>
                        )
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave unchecked for all services</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Applicable Tiers</label>
                    <div className="space-y-2">
                      {['economy', 'standard', 'premium'].map((tier) => (
                        <label key={tier} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.applicableTiers?.includes(tier) ?? false}
                            onChange={(e) => {
                              const tiers = formData.applicableTiers || [];
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  applicableTiers: [...tiers, tier],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  applicableTiers: tiers.filter((t) => t !== tier),
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded text-brand-red"
                          />
                          <span className="text-sm capitalize">{tier}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave unchecked for all tiers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule & Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Validity Period</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.startsAt}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startsAt: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.expiresAt || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expiresAt: e.target.value || undefined,
                          }))
                        }
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        min={formData.startsAt}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                  </div>
                </div>
              </div>

              {/* Review Summary */}
              <div>
                <h3 className="font-medium mb-4">Review</h3>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Code</span>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded font-mono font-bold">
                      {formData.code || '—'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{formData.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-brand-red">
                      {formData.discountType === 'percent'
                        ? `${formData.discountValue}%`
                        : `$${formData.discountValue.toFixed(2)}`}
                      {formData.maxDiscountAmount && ` (max $${formData.maxDiscountAmount})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Min Order</span>
                    <span>${formData.minOrderAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Usage Limit</span>
                    <span>
                      {formData.maxUsesTotal
                        ? `${formData.maxUsesTotal} total`
                        : 'Unlimited'}
                      {' / '}
                      {formData.maxUsesPerCustomer} per customer
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Customers</span>
                    <span>
                      {formData.newCustomersOnly
                        ? 'New only'
                        : formData.existingCustomersOnly
                        ? 'Existing only'
                        : 'All customers'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Valid Period</span>
                    <span>
                      {formData.startsAt
                        ? new Date(formData.startsAt).toLocaleDateString()
                        : 'Now'}
                      {' → '}
                      {formData.expiresAt
                        ? new Date(formData.expiresAt).toLocaleDateString()
                        : 'No expiration'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-blue-700">
                  The code will be active immediately after creation. You can edit or deactivate it
                  at any time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-700">
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.code || !formData.name)}
              className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Code
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateDiscountCodeModal;
