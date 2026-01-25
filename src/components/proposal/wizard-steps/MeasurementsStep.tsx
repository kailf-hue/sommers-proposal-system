/**
 * Measurements Step - Wizard Step 3
 * Property measurements and surface condition
 */

import { Ruler, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useProposalStore, type SurfaceCondition } from '@/stores/proposalStore';
import { cn } from '@/lib/utils';

const conditionOptions: Array<{
  id: SurfaceCondition;
  label: string;
  description: string;
  multiplier: string;
  color: string;
  icon: typeof CheckCircle;
}> = [
  {
    id: 'good',
    label: 'Good',
    description: 'Minor wear, few cracks',
    multiplier: '1.0x',
    color: 'green',
    icon: CheckCircle,
  },
  {
    id: 'fair',
    label: 'Fair',
    description: 'Moderate cracking, some repairs needed',
    multiplier: '1.15x',
    color: 'yellow',
    icon: AlertTriangle,
  },
  {
    id: 'poor',
    label: 'Poor',
    description: 'Significant damage, extensive repairs',
    multiplier: '1.3x',
    color: 'red',
    icon: AlertCircle,
  },
];

const measurementFields = [
  { id: 'crackLinearFeet', label: 'Crack Linear Feet', unit: 'LF', placeholder: '0' },
  { id: 'crackBoxes', label: 'Crack Boxes (4x4)', unit: 'boxes', placeholder: '0' },
  { id: 'potholes', label: 'Potholes', unit: 'count', placeholder: '0' },
  { id: 'alligatorSqft', label: 'Alligator Cracking', unit: 'sq ft', placeholder: '0' },
  { id: 'parkingStalls', label: 'Parking Stalls', unit: 'count', placeholder: '0' },
  { id: 'adaStalls', label: 'ADA Stalls', unit: 'count', placeholder: '0' },
  { id: 'arrows', label: 'Directional Arrows', unit: 'count', placeholder: '0' },
  { id: 'fireLaneFeet', label: 'Fire Lane', unit: 'LF', placeholder: '0' },
  { id: 'customStencils', label: 'Custom Stencils', unit: 'count', placeholder: '0' },
];

export default function MeasurementsStep() {
  const { formData, setFormField, setMeasurement } = useProposalStore();

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Ruler className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Property Measurements
          </h2>
          <p className="text-sm text-gray-500">
            Enter measurements and assess surface condition
          </p>
        </div>
      </div>

      {/* Surface Condition */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Surface Condition <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conditionOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFormField('surfaceCondition', option.id)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                formData.surfaceCondition === option.id
                  ? option.color === 'green'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : option.color === 'yellow'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <option.icon
                    className={cn(
                      'h-5 w-5',
                      option.color === 'green' && 'text-green-500',
                      option.color === 'yellow' && 'text-yellow-500',
                      option.color === 'red' && 'text-red-500'
                    )}
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {option.multiplier}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area Measurements */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Area Measurements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Total Square Footage <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.measurements.totalSqft || ''}
                onChange={(e) => setMeasurement('totalSqft', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Deductions (islands, etc.)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.measurements.deductionSqft || ''}
                onChange={(e) => setMeasurement('deductionSqft', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Net Sq Ft</label>
              <div className="h-10 px-4 flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold text-brand-red">
                {formData.measurements.netSqft.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Measurements */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Detailed Measurements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {measurementFields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs text-gray-500 mb-1">
                  {field.label}
                  <span className="text-gray-400 ml-1">({field.unit})</span>
                </label>
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={formData.measurements[field.id as keyof typeof formData.measurements] || ''}
                  onChange={(e) =>
                    setMeasurement(
                      field.id as keyof typeof formData.measurements,
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condition Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Condition Notes
        </label>
        <textarea
          placeholder="Describe any specific issues or observations..."
          value={formData.conditionNotes}
          onChange={(e) => setFormField('conditionNotes', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        />
      </div>

      {/* Validation Message */}
      {formData.measurements.netSqft === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Please enter the total square footage to continue
        </p>
      )}
    </div>
  );
}
