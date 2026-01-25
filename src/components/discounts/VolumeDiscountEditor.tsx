/**
 * Sommer's Proposal System - Volume Discount Tiers Editor
 * Configure bulk/volume discount tiers based on square footage or order amount
 */

import { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  GripVertical,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { volumeDiscountService } from '@/lib/discounts/discountService';
import type { VolumeDiscountTier, VolumeTierLevel, VolumeMeasurementType } from '@/lib/discounts/discountTypes';

interface VolumeDiscountEditorProps {
  tier?: VolumeDiscountTier;
  orgId: string;
  onSave: (tier: VolumeDiscountTier) => void;
  onCancel: () => void;
}

const MEASUREMENT_TYPES: { value: VolumeMeasurementType; label: string; unit: string }[] = [
  { value: 'total_sqft', label: 'Total Square Footage', unit: 'sq ft' },
  { value: 'total_amount', label: 'Order Total', unit: '$' },
  { value: 'service_quantity', label: 'Service Quantity', unit: 'sq ft' },
  { value: 'annual_volume', label: 'Annual Volume', unit: '$' },
];

const SERVICE_OPTIONS = [
  { value: '', label: 'All Services' },
  { value: 'sealcoating', label: 'Sealcoating' },
  { value: 'crack_filling', label: 'Crack Filling' },
  { value: 'line_striping', label: 'Line Striping' },
  { value: 'pothole_repair', label: 'Pothole Repair' },
];

// Default tiers for sealcoating
const DEFAULT_SQFT_TIERS: VolumeTierLevel[] = [
  { min: 0, max: 4999, discountPercent: 0, discountFixed: 0, label: 'Standard' },
  { min: 5000, max: 9999, discountPercent: 5, discountFixed: 0, label: 'Bronze' },
  { min: 10000, max: 24999, discountPercent: 10, discountFixed: 0, label: 'Silver' },
  { min: 25000, max: 49999, discountPercent: 15, discountFixed: 0, label: 'Gold' },
  { min: 50000, max: null, discountPercent: 20, discountFixed: 0, label: 'Platinum' },
];

const DEFAULT_AMOUNT_TIERS: VolumeTierLevel[] = [
  { min: 0, max: 999, discountPercent: 0, discountFixed: 0, label: 'Standard' },
  { min: 1000, max: 2499, discountPercent: 5, discountFixed: 0, label: 'Bronze' },
  { min: 2500, max: 4999, discountPercent: 7, discountFixed: 0, label: 'Silver' },
  { min: 5000, max: 9999, discountPercent: 10, discountFixed: 0, label: 'Gold' },
  { min: 10000, max: null, discountPercent: 15, discountFixed: 0, label: 'Platinum' },
];

export function VolumeDiscountEditor({
  tier: existingTier,
  orgId,
  onSave,
  onCancel,
}: VolumeDiscountEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(existingTier?.name || 'Volume Discount');
  const [description, setDescription] = useState(existingTier?.description || '');
  const [measurementType, setMeasurementType] = useState<VolumeMeasurementType>(
    existingTier?.measurementType || 'total_sqft'
  );
  const [serviceType, setServiceType] = useState(existingTier?.serviceType || '');
  const [stackable, setStackable] = useState(existingTier?.stackable || false);
  const [priority, setPriority] = useState(existingTier?.priority || 0);
  const [tiers, setTiers] = useState<VolumeTierLevel[]>(
    existingTier?.tiers || DEFAULT_SQFT_TIERS
  );

  // Get measurement info
  const measurementInfo = MEASUREMENT_TYPES.find((m) => m.value === measurementType);

  // Update tier at index
  const updateTier = (index: number, updates: Partial<VolumeTierLevel>) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setTiers(newTiers);
  };

  // Add new tier
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier.max ? lastTier.max + 1 : lastTier.min + 10000;
    setTiers([
      ...tiers,
      {
        min: newMin,
        max: null,
        discountPercent: lastTier.discountPercent + 5,
        discountFixed: 0,
        label: '',
      },
    ]);
    
    // Update previous tier's max
    if (tiers.length > 0) {
      updateTier(tiers.length - 1, { max: newMin - 1 });
    }
  };

  // Remove tier
  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    const newTiers = tiers.filter((_, i) => i !== index);
    
    // Update max of previous tier if we removed a middle tier
    if (index > 0 && index < tiers.length) {
      newTiers[index - 1] = {
        ...newTiers[index - 1],
        max: index < newTiers.length ? newTiers[index].min - 1 : null,
      };
    }
    
    setTiers(newTiers);
  };

  // Apply default tiers based on measurement type
  const applyDefaults = () => {
    if (measurementType === 'total_sqft' || measurementType === 'service_quantity') {
      setTiers([...DEFAULT_SQFT_TIERS]);
    } else {
      setTiers([...DEFAULT_AMOUNT_TIERS]);
    }
  };

  // Validate tiers
  const validateTiers = (): string | null => {
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      
      if (tier.min < 0) {
        return `Tier ${i + 1}: Minimum cannot be negative`;
      }
      
      if (tier.max !== null && tier.max <= tier.min) {
        return `Tier ${i + 1}: Maximum must be greater than minimum`;
      }
      
      if (tier.discountPercent < 0 || tier.discountPercent > 100) {
        return `Tier ${i + 1}: Discount must be between 0 and 100%`;
      }
      
      if (i > 0) {
        const prevTier = tiers[i - 1];
        if (prevTier.max !== null && tier.min !== prevTier.max + 1) {
          return `Tier ${i + 1}: Minimum should be ${prevTier.max! + 1} (no gaps allowed)`;
        }
      }
    }
    
    return null;
  };

  // Handle save
  const handleSave = async () => {
    const validationError = validateTiers();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const saved = await volumeDiscountService.create(orgId, {
        name,
        description: description || undefined,
        measurementType,
        serviceType: serviceType || undefined,
        tiers,
        stackable,
        priority,
        isActive: true,
      });
      onSave(saved);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number for display
  const formatValue = (value: number) => {
    if (measurementType === 'total_amount' || measurementType === 'annual_volume') {
      return `$${value.toLocaleString()}`;
    }
    return `${value.toLocaleString()} sq ft`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {existingTier ? 'Edit Volume Discount' : 'Create Volume Discount'}
          </h3>
          <p className="text-sm text-gray-500">
            Reward customers who book larger projects
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Basic Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Volume Discount"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Measurement Type
          </label>
          <select
            value={measurementType}
            onChange={(e) => {
              setMeasurementType(e.target.value as VolumeMeasurementType);
              // Reset tiers when type changes
              if (e.target.value === 'total_sqft' || e.target.value === 'service_quantity') {
                setTiers([...DEFAULT_SQFT_TIERS]);
              } else {
                setTiers([...DEFAULT_AMOUNT_TIERS]);
              }
            }}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {MEASUREMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {(measurementType === 'service_quantity') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border rounded-lg"
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional internal description"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Tiers Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Discount Tiers</h4>
          <button
            type="button"
            onClick={applyDefaults}
            className="text-sm text-blue-600 hover:underline"
          >
            Reset to defaults
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700">
            Tiers must be consecutive with no gaps. The last tier typically has no maximum (unlimited).
          </p>
        </div>

        {/* Tier Headers */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
          <div className="col-span-1"></div>
          <div className="col-span-2">Label</div>
          <div className="col-span-2">Minimum</div>
          <div className="col-span-2">Maximum</div>
          <div className="col-span-2">Discount %</div>
          <div className="col-span-2">Preview</div>
          <div className="col-span-1"></div>
        </div>

        {/* Tier Rows */}
        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg"
            >
              <div className="col-span-1 text-gray-400">
                <GripVertical className="w-4 h-4" />
              </div>
              
              <div className="col-span-2">
                <input
                  type="text"
                  value={tier.label || ''}
                  onChange={(e) => updateTier(index, { label: e.target.value })}
                  placeholder={`Tier ${index + 1}`}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              
              <div className="col-span-2">
                <input
                  type="number"
                  value={tier.min}
                  onChange={(e) => updateTier(index, { min: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              
              <div className="col-span-2">
                <input
                  type="number"
                  value={tier.max ?? ''}
                  onChange={(e) => updateTier(index, { max: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="∞"
                  min={tier.min + 1}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              
              <div className="col-span-2">
                <div className="relative">
                  <input
                    type="number"
                    value={tier.discountPercent}
                    onChange={(e) => updateTier(index, { discountPercent: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    className="w-full px-2 py-1.5 border rounded text-sm pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
              
              <div className="col-span-2 text-sm">
                <span className="text-gray-600">
                  {formatValue(tier.min)} - {tier.max ? formatValue(tier.max) : '∞'}
                </span>
                {tier.discountPercent > 0 && (
                  <span className="ml-1 text-green-600 font-medium">
                    ({tier.discountPercent}% off)
                  </span>
                )}
              </div>
              
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  disabled={tiers.length <= 1}
                  className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTier}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {/* Options */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={stackable}
            onChange={(e) => setStackable(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600"
          />
          <span className="text-sm text-gray-700">Stackable with other discounts</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Priority:</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Preview</h4>
        <div className="flex flex-wrap gap-2">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={cn(
                'px-3 py-2 rounded-lg text-center',
                tier.discountPercent > 0 ? 'bg-green-100' : 'bg-gray-100'
              )}
            >
              <div className="text-xs text-gray-500">{tier.label || `Tier ${index + 1}`}</div>
              <div className="font-bold text-green-700">
                {tier.discountPercent > 0 ? `${tier.discountPercent}%` : 'No discount'}
              </div>
              <div className="text-xs text-gray-600">
                {formatValue(tier.min)}{tier.max ? ` - ${formatValue(tier.max)}` : '+'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !name.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Volume Discount
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default VolumeDiscountEditor;
