/**
 * Services Step - Wizard Step 4
 * Select services for the proposal
 */

import { Wrench, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useProposalStore } from '@/stores/proposalStore';
import { cn, formatCurrency, DEFAULT_PRICING } from '@/lib/utils';

const services = [
  {
    id: 'sealcoating',
    name: 'Sealcoating',
    description: 'Protective coating for asphalt surfaces',
    icon: '🛡️',
    pricing: DEFAULT_PRICING.sealcoating,
    unit: 'sq ft',
    measurementKey: 'netSqft',
  },
  {
    id: 'crack-filling',
    name: 'Crack Filling',
    description: 'Fill and seal cracks to prevent water damage',
    icon: '🔧',
    pricing: DEFAULT_PRICING.crackFilling,
    unit: 'LF',
    measurementKey: 'crackLinearFeet',
  },
  {
    id: 'pothole-repair',
    name: 'Pothole Repair',
    description: 'Repair potholes and surface damage',
    icon: '🕳️',
    pricing: DEFAULT_PRICING.pothole,
    unit: 'each',
    measurementKey: 'potholes',
  },
  {
    id: 'line-striping',
    name: 'Line Striping',
    description: 'Parking lines and markings',
    icon: '📐',
    pricing: DEFAULT_PRICING.striping,
    unit: 'line',
    measurementKey: 'parkingStalls',
  },
  {
    id: 'ada-stalls',
    name: 'ADA/Handicap Stalls',
    description: 'ADA compliant handicap parking',
    icon: '♿',
    pricing: DEFAULT_PRICING.adaStall,
    unit: 'stall',
    measurementKey: 'adaStalls',
  },
  {
    id: 'arrows',
    name: 'Directional Arrows',
    description: 'Traffic flow arrows',
    icon: '➡️',
    pricing: DEFAULT_PRICING.arrow,
    unit: 'each',
    measurementKey: 'arrows',
  },
  {
    id: 'fire-lane',
    name: 'Fire Lane',
    description: 'Fire lane markings',
    icon: '🚒',
    pricing: DEFAULT_PRICING.fireLane,
    unit: 'LF',
    measurementKey: 'fireLaneFeet',
  },
  {
    id: 'stencils',
    name: 'Custom Stencils',
    description: 'Custom text and symbols',
    icon: '✏️',
    pricing: DEFAULT_PRICING.stencil,
    unit: 'each',
    measurementKey: 'customStencils',
  },
];

export default function ServicesStep() {
  const { formData, toggleService, addCustomLineItem, removeCustomLineItem, customLineItems } = useProposalStore();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: 'each',
    unitPrice: 0,
  });

  const handleAddCustomItem = () => {
    if (customItem.name && customItem.quantity > 0 && customItem.unitPrice > 0) {
      addCustomLineItem({
        serviceId: 'custom',
        name: customItem.name,
        description: customItem.description,
        quantity: customItem.quantity,
        unit: customItem.unit,
        unitPrice: customItem.unitPrice,
        total: customItem.quantity * customItem.unitPrice,
        tier: 'all',
      });
      setCustomItem({ name: '', description: '', quantity: 0, unit: 'each', unitPrice: 0 });
      setShowCustomForm(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Services
          </h2>
          <p className="text-sm text-gray-500">
            Choose the services to include in this proposal
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = formData.selectedServices.includes(service.id);
          const quantity = formData.measurements[service.measurementKey as keyof typeof formData.measurements] || 0;
          const estimatedCost = Number(quantity) * service.pricing.default;

          return (
            <Card
              key={service.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-brand-red'
              )}
              onClick={() => toggleService(service.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {service.name}
                      </h3>
                      <p className="text-xs text-gray-500">{service.description}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-brand-red bg-brand-red text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${service.pricing.default.toFixed(2)}
                    </span>
                    /{service.unit}
                  </div>
                  {Number(quantity) > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {Number(quantity).toLocaleString()} {service.unit}
                      </p>
                      <p className="font-semibold text-brand-red">
                        {formatCurrency(estimatedCost)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Custom Line Items
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCustomForm(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Custom Item
          </Button>
        </div>

        {/* Custom Items List */}
        {formData.customLineItems.length > 0 && (
          <div className="space-y-2">
            {formData.customLineItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brand-red">
                    {formatCurrency(item.total)}
                  </span>
                  <button
                    onClick={() => removeCustomLineItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Item Form */}
        {showCustomForm && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <Input
                    placeholder="Item name"
                    value={customItem.name}
                    onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={customItem.quantity || ''}
                    onChange={(e) => setCustomItem({ ...customItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={customItem.unitPrice || ''}
                    onChange={(e) => setCustomItem({ ...customItem, unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button size="sm" onClick={handleAddCustomItem}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCustomForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Count */}
      <div className="rounded-lg bg-brand-red/10 p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-bold text-brand-red">
            {formData.selectedServices.length + formData.customLineItems.length}
          </span>{' '}
          services selected
        </p>
      </div>

      {/* Validation */}
      {formData.selectedServices.length === 0 && formData.customLineItems.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ Please select at least one service to continue
        </p>
      )}
    </div>
  );
}
