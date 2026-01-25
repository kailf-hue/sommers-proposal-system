/**
 * Sommer's Proposal System - Seasonal Campaign Modal
 * Create and edit time-limited promotional campaigns
 */

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Palette,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { seasonalDiscountService } from '@/lib/discounts/discountService';
import type { SeasonalDiscount, CreateSeasonalDiscountInput } from '@/lib/discounts/discountTypes';

interface SeasonalCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: SeasonalDiscount) => void;
  editingCampaign?: SeasonalDiscount | null;
  orgId: string;
  userId: string;
}

const PRESET_CAMPAIGNS = [
  {
    name: 'Spring Special',
    bannerText: '🌸 Spring Special! Save on your sealcoating project',
    bannerColor: '#10B981',
    startMonth: 3,
    endMonth: 5,
  },
  {
    name: 'Summer Saver',
    bannerText: '☀️ Beat the heat with summer savings!',
    bannerColor: '#F59E0B',
    startMonth: 6,
    endMonth: 8,
  },
  {
    name: 'Fall Prep',
    bannerText: '🍂 Prepare for winter - Fall discounts!',
    bannerColor: '#EF4444',
    startMonth: 9,
    endMonth: 11,
  },
  {
    name: 'Holiday Special',
    bannerText: '🎄 Holiday Special Pricing!',
    bannerColor: '#DC2626',
    startMonth: 12,
    endMonth: 12,
  },
  {
    name: 'Black Friday',
    bannerText: '⚡ Black Friday - Biggest Savings of the Year!',
    bannerColor: '#000000',
    startMonth: 11,
    endMonth: 11,
  },
];

const COLOR_PRESETS = [
  '#C41E3A', // Brand Red
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#000000', // Black
];

export function SeasonalCampaignModal({
  isOpen,
  onClose,
  onSave,
  editingCampaign,
  orgId,
  userId,
}: SeasonalCampaignModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('#C41E3A');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>();
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState('');
  const [showCountdown, setShowCountdown] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'yearly' | 'monthly'>('yearly');
  const [applicableServices, setApplicableServices] = useState<string[]>([]);

  // Reset form
  useEffect(() => {
    if (isOpen) {
      if (editingCampaign) {
        setName(editingCampaign.name);
        setDescription(editingCampaign.description || '');
        setBannerText(editingCampaign.bannerText || '');
        setBannerColor(editingCampaign.bannerColor);
        setStartsAt(editingCampaign.startsAt.split('T')[0]);
        setExpiresAt(editingCampaign.expiresAt.split('T')[0]);
        setDiscountType(editingCampaign.discountType);
        setDiscountValue(editingCampaign.discountValue);
        setMaxDiscountAmount(editingCampaign.maxDiscountAmount);
        setMinOrderAmount(editingCampaign.minOrderAmount);
        setPromoCode(editingCampaign.promoCode || '');
        setShowCountdown(editingCampaign.showCountdown);
        setShowBanner(editingCampaign.showBanner);
        setIsRecurring(editingCampaign.isRecurring);
        setRecurrenceType(editingCampaign.recurrenceType || 'yearly');
        setApplicableServices(editingCampaign.applicableServices || []);
      } else {
        // Default dates: today to 30 days from now
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);

        setName('');
        setDescription('');
        setBannerText('');
        setBannerColor('#C41E3A');
        setStartsAt(today.toISOString().split('T')[0]);
        setExpiresAt(endDate.toISOString().split('T')[0]);
        setDiscountType('percent');
        setDiscountValue(15);
        setMaxDiscountAmount(undefined);
        setMinOrderAmount(0);
        setPromoCode('');
        setShowCountdown(true);
        setShowBanner(true);
        setIsRecurring(false);
        setRecurrenceType('yearly');
        setApplicableServices([]);
      }
      setError(null);
    }
  }, [isOpen, editingCampaign]);

  // Apply preset
  const applyPreset = (preset: typeof PRESET_CAMPAIGNS[0]) => {
    setName(preset.name);
    setBannerText(preset.bannerText);
    setBannerColor(preset.bannerColor);

    // Set dates based on current year
    const year = new Date().getFullYear();
    const startDate = new Date(year, preset.startMonth - 1, 1);
    const endDate = new Date(year, preset.endMonth, 0); // Last day of end month

    setStartsAt(startDate.toISOString().split('T')[0]);
    setExpiresAt(endDate.toISOString().split('T')[0]);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const input: CreateSeasonalDiscountInput = {
        name,
        description: description || undefined,
        bannerText: bannerText || undefined,
        bannerColor,
        startsAt: new Date(startsAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        discountType,
        discountValue,
        maxDiscountAmount,
        minOrderAmount,
        promoCode: promoCode || undefined,
        showCountdown,
        showBanner,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : undefined,
        applicableServices: applicableServices.length > 0 ? applicableServices : undefined,
      };

      const saved = await seasonalDiscountService.create(orgId, input, userId);
      onSave(saved);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate duration
  const getDuration = () => {
    if (!startsAt || !expiresAt) return null;
    const start = new Date(startsAt);
    const end = new Date(expiresAt);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const duration = getDuration();

  // Service options
  const serviceOptions = [
    { value: 'sealcoating', label: 'Sealcoating' },
    { value: 'crack_filling', label: 'Crack Filling' },
    { value: 'line_striping', label: 'Line Striping' },
    { value: 'pothole_repair', label: 'Pothole Repair' },
    { value: 'ada_compliance', label: 'ADA Compliance' },
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
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCampaign ? 'Edit Campaign' : 'Create Seasonal Campaign'}
              </h2>
              <p className="text-sm text-gray-500">
                Time-limited promotional discount
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Quick Presets */}
            {!editingCampaign && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Start - Use a Preset
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CAMPAIGNS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Banner Preview */}
            {showBanner && (bannerText || name) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Banner Preview</label>
                <div
                  className="p-4 rounded-lg text-white"
                  style={{ backgroundColor: bannerColor }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5" />
                    <span className="font-bold">{name || 'Campaign Name'}</span>
                  </div>
                  {bannerText && <p className="text-sm opacity-90">{bannerText}</p>}
                  {showCountdown && duration && (
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{duration} days remaining</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Name & Banner Text */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Spring Special"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Color
                </label>
                <div className="flex gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBannerColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                        bannerColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Text
              </label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="🌸 Spring Special! Save on your sealcoating project"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Emojis are supported! 🎉</p>
            </div>

            {/* Dates */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Campaign Period
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={startsAt}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {duration !== null && (
                <p className="text-sm text-gray-600">
                  Campaign duration: <strong>{duration} days</strong>
                </p>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Recurring Campaign</span>
                  <p className="text-sm text-gray-500">Automatically repeat this campaign</p>
                </div>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as 'yearly' | 'monthly')}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
            </div>

            {/* Discount Value */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">Discount Value</h3>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2',
                    discountType === 'percent'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
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
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                  Fixed Amount
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={minOrderAmount || ''}
                      onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                      placeholder="No minimum"
                      min={0}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Promo Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Associated Promo Code (Optional)
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="SPRING2026"
                className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a matching promo code customers can share
              </p>
            </div>

            {/* Display Options */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Display Options
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBanner}
                  onChange={(e) => setShowBanner(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Show promotional banner</span>
                  <p className="text-sm text-gray-500">Display banner in proposal builder</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCountdown}
                  onChange={(e) => setShowCountdown(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Show countdown timer</span>
                  <p className="text-sm text-gray-500">Display time remaining until campaign ends</p>
                </div>
              </label>
            </div>

            {/* Applicable Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Services (leave empty for all)
              </label>
              <div className="flex flex-wrap gap-2">
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
                      className="w-4 h-4 rounded border-gray-300 text-orange-600"
                    />
                    <span className="text-sm">{service.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !startsAt || !expiresAt}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SeasonalCampaignModal;
