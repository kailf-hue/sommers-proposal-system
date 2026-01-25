/**
 * Sommer's Proposal System - Discount Code Modal
 * Create and edit promo codes with all options
 */

import { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { discountCodesService } from '@/lib/discounts/discountService';
import type { DiscountCode, CreateDiscountCodeInput } from '@/lib/discounts/discountTypes';

interface DiscountCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: DiscountCode) => void;
  editingCode?: DiscountCode | null;
  orgId: string;
}

export function DiscountCodeModal({
  isOpen,
  onClose,
  onSave,
  editingCode,
  orgId,
}: DiscountCodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>();
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxUsesTotal, setMaxUsesTotal] = useState<number | undefined>();
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [newCustomersOnly, setNewCustomersOnly] = useState(false);
  const [existingCustomersOnly, setExistingCustomersOnly] = useState(false);
  const [applicableServices, setApplicableServices] = useState<string[]>([]);
  const [applicableTiers, setApplicableTiers] = useState<string[]>([]);

  // Reset form when modal opens/closes or editing code changes
  useEffect(() => {
    if (isOpen) {
      if (editingCode) {
        setCode(editingCode.code);
        setName(editingCode.name);
        setDescription(editingCode.description || '');
        setDiscountType(editingCode.discountType);
        setDiscountValue(editingCode.discountValue);
        setMaxDiscountAmount(editingCode.maxDiscountAmount);
        setMinOrderAmount(editingCode.minOrderAmount);
        setMaxUsesTotal(editingCode.maxUsesTotal);
        setMaxUsesPerCustomer(editingCode.maxUsesPerCustomer);
        setStartsAt(editingCode.startsAt.split('T')[0]);
        setExpiresAt(editingCode.expiresAt?.split('T')[0] || '');
        setNewCustomersOnly(editingCode.newCustomersOnly);
        setExistingCustomersOnly(editingCode.existingCustomersOnly);
        setApplicableServices(editingCode.applicableServices || []);
        setApplicableTiers(editingCode.applicableTiers || []);
      } else {
        // Reset to defaults
        setCode('');
        setName('');
        setDescription('');
        setDiscountType('percent');
        setDiscountValue(10);
        setMaxDiscountAmount(undefined);
        setMinOrderAmount(0);
        setMaxUsesTotal(undefined);
        setMaxUsesPerCustomer(1);
        setStartsAt(new Date().toISOString().split('T')[0]);
        setExpiresAt('');
        setNewCustomersOnly(false);
        setExistingCustomersOnly(false);
        setApplicableServices([]);
        setApplicableTiers([]);
      }
      setError(null);
    }
  }, [isOpen, editingCode]);

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const input: CreateDiscountCodeInput = {
        code: code.toUpperCase().trim(),
        name,
        description: description || undefined,
        discountType,
        discountValue,
        maxDiscountAmount,
        minOrderAmount,
        maxUsesTotal,
        maxUsesPerCustomer,
        startsAt: new Date(startsAt).toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        newCustomersOnly,
        existingCustomersOnly,
        applicableServices: applicableServices.length > 0 ? applicableServices : undefined,
        applicableTiers: applicableTiers.length > 0 ? applicableTiers : undefined,
      };

      let savedCode: DiscountCode;
      if (editingCode) {
        savedCode = await discountCodesService.update(editingCode.id, input);
      } else {
        savedCode = await discountCodesService.create(orgId, input);
      }

      onSave(savedCode);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save discount code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Service options
  const serviceOptions = [
    { value: 'sealcoating', label: 'Sealcoating' },
    { value: 'crack_filling', label: 'Crack Filling' },
    { value: 'line_striping', label: 'Line Striping' },
    { value: 'pothole_repair', label: 'Pothole Repair' },
    { value: 'ada_compliance', label: 'ADA Compliance' },
  ];

  // Tier options
  const tierOptions = [
    { value: 'economy', label: 'Economy' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingCode ? 'Update promo code settings' : 'Create a new promo code for customers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">Error</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Code & Name */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER10"
                    required
                    maxLength={20}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono uppercase focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors"
                    title="Generate random code"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Letters and numbers only, max 20 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer Sale 10% Off"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (shown to customers)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Get 10% off your sealcoating project this summer!"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none"
              />
            </div>

            {/* Discount Value */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Discount Value</h3>

              {/* Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2',
                    discountType === 'percent'
                      ? 'border-brand-red bg-brand-red/5 text-brand-red'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <Percent className="w-4 h-4" />
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2',
                    discountType === 'fixed'
                      ? 'border-brand-red bg-brand-red/5 text-brand-red'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Fixed Amount
                </button>
              </div>

              {/* Value Input */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {discountType === 'percent' ? 'Percentage Off' : 'Amount Off'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {discountType === 'fixed' && (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      required
                      min={0}
                      max={discountType === 'percent' ? 100 : undefined}
                      step={discountType === 'percent' ? 1 : 0.01}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red',
                        discountType === 'fixed' && 'pl-8'
                      )}
                    />
                    {discountType === 'percent' && (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {discountType === 'percent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Discount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={maxDiscountAmount || ''}
                        onChange={(e) => setMaxDiscountAmount(parseFloat(e.target.value) || undefined)}
                        placeholder="No limit"
                        min={0}
                        step={0.01}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cap the maximum discount amount</p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Limits */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Usage Limits</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Order
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={minOrderAmount || ''}
                      onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      step={0.01}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Uses
                  </label>
                  <input
                    type="number"
                    value={maxUsesTotal || ''}
                    onChange={(e) => setMaxUsesTotal(parseInt(e.target.value) || undefined)}
                    placeholder="Unlimited"
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Uses per Customer
                  </label>
                  <input
                    type="number"
                    value={maxUsesPerCustomer}
                    onChange={(e) => setMaxUsesPerCustomer(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Validity Period
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={startsAt}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                </div>
              </div>
            </div>

            {/* Customer Restrictions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customer Restrictions
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCustomersOnly}
                    onChange={(e) => {
                      setNewCustomersOnly(e.target.checked);
                      if (e.target.checked) setExistingCustomersOnly(false);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">New customers only</span>
                    <p className="text-sm text-gray-500">Only first-time customers can use this code</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={existingCustomersOnly}
                    onChange={(e) => {
                      setExistingCustomersOnly(e.target.checked);
                      if (e.target.checked) setNewCustomersOnly(false);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Existing customers only</span>
                    <p className="text-sm text-gray-500">Only returning customers can use this code</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Service & Tier Restrictions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Apply To</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Services (leave empty for all)
                  </label>
                  <div className="space-y-2">
                    {serviceOptions.map((service) => (
                      <label key={service.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applicableServices.includes(service.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicableServices([...applicableServices, service.value]);
                            } else {
                              setApplicableServices(applicableServices.filter((s) => s !== service.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiers (leave empty for all)
                  </label>
                  <div className="space-y-2">
                    {tierOptions.map((tier) => (
                      <label key={tier.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applicableTiers.includes(tier.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplicableTiers([...applicableTiers, tier.value]);
                            } else {
                              setApplicableTiers(applicableTiers.filter((t) => t !== tier.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tier.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim() || !name.trim()}
              className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {editingCode ? 'Update Code' : 'Create Code'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DiscountCodeModal;
