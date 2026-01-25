/**
 * Sommer's Proposal System - Bulk Discount Code Generator
 * Generate multiple unique promo codes at once
 */

import { useState } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Download,
  Copy,
  CheckCircle,
  Loader2,
  Shuffle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { discountCodesService } from '@/lib/discounts/discountService';
import type { CreateDiscountCodeInput, DiscountCode } from '@/lib/discounts/discountTypes';

interface BulkCodeGeneratorProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (codes: DiscountCode[]) => void;
}

type CodePattern = 'random' | 'sequential' | 'prefix';

export function BulkCodeGenerator({
  orgId,
  isOpen,
  onClose,
  onGenerated,
}: BulkCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<DiscountCode[]>([]);
  const [step, setStep] = useState<'config' | 'preview' | 'complete'>('config');

  // Configuration state
  const [config, setConfig] = useState({
    quantity: 10,
    pattern: 'random' as CodePattern,
    prefix: 'PROMO',
    codeLength: 8,
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: 10,
    maxDiscountAmount: undefined as number | undefined,
    minOrderAmount: 0,
    maxUsesPerCode: 1,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
    nameSuffix: 'Bulk Generated Code',
  });

  // Preview codes (before generation)
  const [previewCodes, setPreviewCodes] = useState<string[]>([]);

  // Generate random code
  const generateRandomCode = (length: number): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Generate codes based on pattern
  const generateCodeStrings = (count: number): string[] => {
    const codes: string[] = [];
    const usedCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let code: string;
      let attempts = 0;

      do {
        switch (config.pattern) {
          case 'random':
            code = generateRandomCode(config.codeLength);
            break;
          case 'sequential':
            code = `${config.prefix}${String(i + 1).padStart(4, '0')}`;
            break;
          case 'prefix':
            code = `${config.prefix}${generateRandomCode(config.codeLength - config.prefix.length)}`;
            break;
          default:
            code = generateRandomCode(config.codeLength);
        }
        attempts++;
      } while (usedCodes.has(code) && attempts < 100);

      usedCodes.add(code);
      codes.push(code);
    }

    return codes;
  };

  // Generate preview
  const handlePreview = () => {
    const codes = generateCodeStrings(Math.min(config.quantity, 5));
    setPreviewCodes(codes);
    setStep('preview');
  };

  // Generate all codes
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const codeStrings = generateCodeStrings(config.quantity);
      const createdCodes: DiscountCode[] = [];

      for (let i = 0; i < codeStrings.length; i++) {
        const input: CreateDiscountCodeInput = {
          code: codeStrings[i],
          name: `${config.nameSuffix} #${i + 1}`,
          description: `Bulk generated code ${i + 1} of ${config.quantity}`,
          discountType: config.discountType,
          discountValue: config.discountValue,
          maxDiscountAmount: config.maxDiscountAmount,
          minOrderAmount: config.minOrderAmount,
          maxUsesTotal: config.maxUsesPerCode,
          maxUsesPerCustomer: 1,
          startsAt: config.startsAt,
          expiresAt: config.expiresAt || undefined,
        };

        const code = await discountCodesService.create(orgId, input);
        createdCodes.push(code);
      }

      setGeneratedCodes(createdCodes);
      setStep('complete');
      onGenerated(createdCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate codes');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Code', 'Discount', 'Min Order', 'Max Uses', 'Expires'];
    const rows = generatedCodes.map((code) => [
      code.code,
      code.discountType === 'percent' ? `${code.discountValue}%` : `$${code.discountValue}`,
      `$${code.minOrderAmount}`,
      code.maxUsesTotal || 'Unlimited',
      code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discount-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Copy all codes
  const handleCopyAll = () => {
    const text = generatedCodes.map((c) => c.code).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Bulk Code Generator</h2>
              <p className="text-sm text-gray-500">
                {step === 'config' && 'Configure your bulk discount codes'}
                {step === 'preview' && 'Preview and confirm generation'}
                {step === 'complete' && `${generatedCodes.length} codes generated!`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Step 1: Configuration */}
          {step === 'config' && (
            <div className="space-y-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium mb-2">Number of Codes</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={config.quantity}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, quantity: parseInt(e.target.value) }))
                    }
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={config.quantity}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        quantity: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)),
                      }))
                    }
                    className="w-20 px-3 py-2 border rounded-lg text-center"
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              {/* Code Pattern */}
              <div>
                <label className="block text-sm font-medium mb-2">Code Pattern</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'random', label: 'Random', desc: 'e.g., XK7M9P2N' },
                    { id: 'sequential', label: 'Sequential', desc: 'e.g., PROMO0001' },
                    { id: 'prefix', label: 'Prefix + Random', desc: 'e.g., SUMMER7K9M' },
                  ].map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, pattern: pattern.id as CodePattern }))
                      }
                      className={cn(
                        'p-3 rounded-lg border-2 text-left',
                        config.pattern === pattern.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="font-medium">{pattern.label}</div>
                      <div className="text-xs text-gray-500">{pattern.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prefix (for prefix and sequential patterns) */}
              {(config.pattern === 'prefix' || config.pattern === 'sequential') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Prefix</label>
                  <input
                    type="text"
                    value={config.prefix}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                      }))
                    }
                    placeholder="e.g., SUMMER"
                    className="w-full px-4 py-2 border rounded-lg uppercase"
                    maxLength={10}
                  />
                </div>
              )}

              {/* Discount Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, discountType: 'percent' }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-1',
                        config.discountType === 'percent'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200'
                      )}
                    >
                      <Percent className="w-4 h-4" />
                      Percent
                    </button>
                    <button
                      onClick={() => setConfig((prev) => ({ ...prev, discountType: 'fixed' }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-1',
                        config.discountType === 'fixed'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200'
                      )}
                    >
                      <DollarSign className="w-4 h-4" />
                      Fixed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <div className="relative">
                    {config.discountType === 'fixed' && (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="number"
                      value={config.discountValue}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          discountValue: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={cn(
                        'w-full px-4 py-2 border rounded-lg',
                        config.discountType === 'fixed' && 'pl-8'
                      )}
                    />
                    {config.discountType === 'percent' && (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Usage & Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Uses Per Code</label>
                  <input
                    type="number"
                    value={config.maxUsesPerCode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxUsesPerCode: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Min Order</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={config.minOrderAmount}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          minOrderAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full pl-8 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Starts</label>
                  <input
                    type="date"
                    value={config.startsAt}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, startsAt: e.target.value }))
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expires (Optional)</label>
                  <input
                    type="date"
                    value={config.expiresAt}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    min={config.startsAt}
                  />
                </div>
              </div>

              {/* Name Template */}
              <div>
                <label className="block text-sm font-medium mb-1">Code Name Suffix</label>
                <input
                  type="text"
                  value={config.nameSuffix}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, nameSuffix: e.target.value }))
                  }
                  placeholder="e.g., Summer Campaign Code"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Summary</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Generating {config.quantity} unique codes</li>
                  <li>
                    • Each code gives{' '}
                    {config.discountType === 'percent'
                      ? `${config.discountValue}% off`
                      : `$${config.discountValue} off`}
                  </li>
                  <li>• {config.maxUsesPerCode} use(s) per code</li>
                  {config.minOrderAmount > 0 && (
                    <li>• Minimum order: ${config.minOrderAmount}</li>
                  )}
                  {config.expiresAt && (
                    <li>• Expires: {new Date(config.expiresAt).toLocaleDateString()}</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Sample Codes (Preview)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {previewCodes.map((code, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-gray-100 rounded font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                  {config.quantity > 5 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      ... and {config.quantity - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">
                  {generatedCodes.length} Codes Generated!
                </h3>
                <p className="text-gray-500 mt-1">
                  Your discount codes are ready to use
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                  Copy All Codes
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Discount</th>
                      <th className="px-4 py-2 text-left">Uses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {generatedCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="px-4 py-2 font-mono">{code.code}</td>
                        <td className="px-4 py-2">
                          {code.discountType === 'percent'
                            ? `${code.discountValue}%`
                            : `$${code.discountValue}`}
                        </td>
                        <td className="px-4 py-2">
                          {code.timesUsed}/{code.maxUsesTotal || '∞'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          {step === 'config' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
              <button
                onClick={handlePreview}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Preview Codes
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('config')}
                className="px-4 py-2 text-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    Generate {config.quantity} Codes
                  </>
                )}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkCodeGenerator;
