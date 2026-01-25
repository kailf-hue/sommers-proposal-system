/**
 * Property Step - Wizard Step 1
 * Property details and address
 */

import { MapPin, Building2, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useProposalStore } from '@/stores/proposalStore';
import { US_STATES } from '@/lib/utils';

const propertyTypes = [
  { id: 'commercial', label: 'Commercial', description: 'Parking lots, shopping centers' },
  { id: 'residential', label: 'Residential', description: 'Driveways, HOA communities' },
  { id: 'industrial', label: 'Industrial', description: 'Warehouses, factories' },
  { id: 'municipal', label: 'Municipal', description: 'Schools, government buildings' },
];

export default function PropertyStep() {
  const { formData, setFormField } = useProposalStore();

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red/10">
          <MapPin className="h-5 w-5 text-brand-red" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Property Information
          </h2>
          <p className="text-sm text-gray-500">
            Enter the property details and location
          </p>
        </div>
      </div>

      {/* Property Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Property Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {propertyTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormField('propertyType', type.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.propertyType === type.id
                  ? 'border-brand-red bg-brand-red/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {type.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Property Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Property Name <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g., Westside Shopping Center"
          value={formData.propertyName}
          onChange={(e) => setFormField('propertyName', e.target.value)}
          leftIcon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* Address */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Property Address <span className="text-red-500">*</span>
        </label>
        
        <Input
          placeholder="Street Address"
          value={formData.address}
          onChange={(e) => setFormField('address', e.target.value)}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2">
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormField('city', e.target.value)}
            />
          </div>
          <div>
            <select
              value={formData.state}
              onChange={(e) => setFormField('state', e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">State</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Input
              placeholder="ZIP"
              value={formData.zip}
              onChange={(e) => setFormField('zip', e.target.value)}
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Quick Measurements */}
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Area Estimate
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Total Square Footage
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.measurements.totalSqft || ''}
                onChange={(e) =>
                  useProposalStore.getState().setMeasurement('totalSqft', Number(e.target.value))
                }
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
                onChange={(e) =>
                  useProposalStore.getState().setMeasurement('deductionSqft', Number(e.target.value))
                }
              />
            </div>
          </div>
          {formData.measurements.netSqft > 0 && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Net Area:{' '}
              <span className="font-semibold text-brand-red">
                {formData.measurements.netSqft.toLocaleString()} sq ft
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Message */}
      {(!formData.propertyName || !formData.address || !formData.city || !formData.state || !formData.zip) && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Please fill in all required fields to continue
        </p>
      )}
    </div>
  );
}
