/**
 * Sommer's Proposal System - Auto Discount Rule Modal
 * Create and edit automatic discount rules
 */

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Percent,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  ShoppingCart,
  Users,
  Calendar,
  Layers,
  TrendingUp,
  Gift,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autoDiscountService } from '@/lib/discounts/discountService';
import type { AutoDiscountRule, CreateAutoRuleInput, AutoDiscountRuleType } from '@/lib/discounts/discountTypes';

interface AutoRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AutoDiscountRule) => void;
  editingRule?: AutoDiscountRule | null;
  orgId: string;
}

const RULE_TYPES: {
  value: AutoDiscountRuleType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'order_minimum',
    label: 'Order Minimum',
    description: 'Discount when order exceeds a minimum amount',
    icon: ShoppingCart,
  },
  {
    value: 'first_order',
    label: 'First Order',
    description: 'Discount for first-time customers',
    icon: Gift,
  },
  {
    value: 'repeat_customer',
    label: 'Repeat Customer',
    description: 'Discount for returning customers',
    icon: Users,
  },
  {
    value: 'service_quantity',
    label: 'Service Quantity',
    description: 'Discount when service quantity exceeds threshold',
    icon: TrendingUp,
  },
  {
    value: 'service_combo',
    label: 'Service Combo',
    description: 'Discount when multiple services are combined',
    icon: Layers,
  },
  {
    value: 'seasonal',
    label: 'Seasonal',
    description: 'Discount during specific months of the year',
    icon: Calendar,
  },
  {
    value: 'day_of_week',
    label: 'Day of Week',
    description: 'Discount on specific days',
    icon: Clock,
  },
];

export function AutoRuleModal({
  isOpen,
  onClose,
  onSave,
  editingRule,
  orgId,
}: AutoRuleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<AutoDiscountRuleType>('order_minimum');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>();
  const [priority, setPriority] = useState<number>(0);
  const [stackable, setStackable] = useState(false);
  const [stackWithCodes, setStackWithCodes] = useState(true);

  // Condition-specific state
  const [minOrderAmount, setMinOrderAmount] = useState<number>(1000);
  const [minServiceQuantity, setMinServiceQuantity] = useState<number>(5000);
  const [serviceType, setServiceType] = useState<string>('sealcoating');
  const [requiredServices, setRequiredServices] = useState<string[]>([]);
  const [requireAllServices, setRequireAllServices] = useState(true);
  const [startMonth, setStartMonth] = useState<number>(3);
  const [endMonth, setEndMonth] = useState<number>(5);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [minOrders, setMinOrders] = useState<number>(1);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingRule) {
        setName(editingRule.name);
        setDescription(editingRule.description || '');
        setRuleType(editingRule.ruleType);
        setDiscountType(editingRule.discountType);
        setDiscountValue(editingRule.discountValue);
        setMaxDiscountAmount(editingRule.maxDiscountAmount);
        setPriority(editingRule.priority);
        setStackable(editingRule.stackable);
        setStackWithCodes(editingRule.stackWithCodes);
        // Load conditions based on type
        const conditions = editingRule.conditions as Record<string, unknown>;
        if (conditions.minAmount) setMinOrderAmount(conditions.minAmount as number);
        if (conditions.minQuantity) setMinServiceQuantity(conditions.minQuantity as number);
        if (conditions.service) setServiceType(conditions.service as string);
        if (conditions.requiredServices) setRequiredServices(conditions.requiredServices as string[]);
        if (conditions.requireAll !== undefined) setRequireAllServices(conditions.requireAll as boolean);
        if (conditions.startMonth) setStartMonth(conditions.startMonth as number);
        if (conditions.endMonth) setEndMonth(conditions.endMonth as number);
        if (conditions.days) setSelectedDays(conditions.days as number[]);
        if (conditions.minOrders) setMinOrders(conditions.minOrders as number);
      } else {
        // Reset to defaults
        setName('');
        setDescription('');
        setRuleType('order_minimum');
        setDiscountType('percent');
        setDiscountValue(10);
        setMaxDiscountAmount(undefined);
        setPriority(0);
        setStackable(false);
        setStackWithCodes(true);
        setMinOrderAmount(1000);
        setMinServiceQuantity(5000);
        setServiceType('sealcoating');
        setRequiredServices([]);
        setRequireAllServices(true);
        setStartMonth(3);
        setEndMonth(5);
        setSelectedDays([1, 2, 3, 4, 5]);
        setMinOrders(1);
      }
      setError(null);
    }
  }, [isOpen, editingRule]);

  // Build conditions based on rule type
  const buildConditions = (): Record<string, unknown> => {
    switch (ruleType) {
      case 'order_minimum':
        return { minAmount: minOrderAmount };
      case 'service_quantity':
        return { service: serviceType, minQuantity: minServiceQuantity, unit: 'sqft' };
      case 'service_combo':
        return { requiredServices, requireAll: requireAllServices };
      case 'first_order':
        return {};
      case 'repeat_customer':
        return { minOrders };
      case 'seasonal':
        return { startMonth, endMonth };
      case 'day_of_week':
        return { days: selectedDays };
      default:
        return {};
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const input: CreateAutoRuleInput = {
        name,
        description: description || undefined,
        ruleType,
        conditions: buildConditions(),
        discountType,
        discountValue,
        maxDiscountAmount,
        priority,
        stackable,
        stackWithCodes,
      };

      const savedRule = await autoDiscountService.create(orgId, input);
      onSave(savedRule);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save rule';
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRule ? 'Edit Auto Discount Rule' : 'Create Auto Discount Rule'}
              </h2>
              <p className="text-sm text-gray-500">
                Automatically apply discounts when conditions are met
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
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Rule Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rule Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {RULE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setRuleType(type.value)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      ruleType === type.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <type.icon
                      className={cn(
                        'w-5 h-5 mb-1',
                        ruleType === type.value ? 'text-purple-600' : 'text-gray-400'
                      )}
                    />
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Description */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Big Order Discount"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Higher priority rules apply first</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal description of this rule"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Condition Configuration */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Conditions</h3>

              {/* Order Minimum */}
              {ruleType === 'order_minimum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Order Amount
                  </label>
                  <div className="relative max-w-xs">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={100}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Discount applies when order total exceeds this amount
                  </p>
                </div>
              )}

              {/* Service Quantity */}
              {ruleType === 'service_quantity' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Service
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {serviceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Square Feet
                    </label>
                    <input
                      type="number"
                      value={minServiceQuantity}
                      onChange={(e) => setMinServiceQuantity(parseInt(e.target.value) || 0)}
                      min={0}
                      step={1000}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Service Combo */}
              {ruleType === 'service_combo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Required Services
                    </label>
                    <div className="space-y-2">
                      {serviceOptions.map((service) => (
                        <label key={service.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requiredServices.includes(service.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequiredServices([...requiredServices, service.value]);
                              } else {
                                setRequiredServices(requiredServices.filter((s) => s !== service.value));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600"
                          />
                          <span className="text-sm">{service.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAllServices}
                      onChange={(e) => setRequireAllServices(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm">Require ALL selected services (otherwise any)</span>
                  </label>
                </div>
              )}

              {/* Repeat Customer */}
              {ruleType === 'repeat_customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Previous Orders
                  </label>
                  <input
                    type="number"
                    value={minOrders}
                    onChange={(e) => setMinOrders(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full max-w-xs px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {/* Seasonal */}
              {ruleType === 'seasonal' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Month
                    </label>
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {monthNames.map((month, i) => (
                        <option key={i} value={i + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Month
                    </label>
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {monthNames.map((month, i) => (
                        <option key={i} value={i + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Day of Week */}
              {ruleType === 'day_of_week' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Active Days
                  </label>
                  <div className="flex gap-2">
                    {dayNames.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (selectedDays.includes(i)) {
                            setSelectedDays(selectedDays.filter((d) => d !== i));
                          } else {
                            setSelectedDays([...selectedDays, i]);
                          }
                        }}
                        className={cn(
                          'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
                          selectedDays.includes(i)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* First Order - No additional conditions */}
              {ruleType === 'first_order' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>This discount automatically applies to first-time customers</span>
                </div>
              )}
            </div>

            {/* Discount Value */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Discount Value</h3>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2',
                    discountType === 'percent'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
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
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Fixed Amount
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {discountType === 'percent' ? 'Percentage Off' : 'Amount Off'}
                  </label>
                  <div className="relative">
                    {discountType === 'fixed' && (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={discountType === 'percent' ? 100 : undefined}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg',
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
                        className="w-full pl-8 pr-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stacking Options */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Stacking Options</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stackable}
                  onChange={(e) => setStackable(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Stackable with other auto rules</span>
                  <p className="text-sm text-gray-500">Can combine with other automatic discounts</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stackWithCodes}
                  onChange={(e) => setStackWithCodes(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Stackable with promo codes</span>
                  <p className="text-sm text-gray-500">Can combine with customer promo codes</p>
                </div>
              </label>
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
              disabled={isLoading || !name.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AutoRuleModal;
