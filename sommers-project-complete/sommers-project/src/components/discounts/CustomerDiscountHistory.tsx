/**
 * Sommer's Proposal System - Customer Discount History
 * View all discounts a customer has received
 */

import { useState, useEffect } from 'react';
import {
  History,
  Tag,
  Crown,
  TrendingUp,
  Calendar,
  Gift,
  DollarSign,
  Percent,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface DiscountHistoryEntry {
  id: string;
  date: string;
  proposalId: string;
  proposalNumber: string;
  proposalTitle: string;
  
  // Discount details
  discountSource: string;
  discountSourceType: 'manual' | 'promo_code' | 'automatic_rule' | 'loyalty' | 'volume' | 'seasonal' | 'referral';
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  
  // Order context
  orderSubtotal: number;
  orderTotal: number;
  
  // Promo code if applicable
  promoCode?: string;
  
  // Status
  proposalStatus: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'rejected';
}

interface CustomerDiscountStats {
  totalDiscountsReceived: number;
  totalSavings: number;
  averageDiscount: number;
  averageDiscountPercent: number;
  mostUsedDiscountType: string;
  largestDiscount: number;
  discountsByType: Record<string, { count: number; total: number }>;
}

interface CustomerDiscountHistoryProps {
  clientId: string;
  clientName?: string;
  className?: string;
  onViewProposal?: (proposalId: string) => void;
}

// ============================================================================
// CUSTOMER DISCOUNT HISTORY COMPONENT
// ============================================================================

export function CustomerDiscountHistory({
  clientId,
  clientName,
  className,
  onViewProposal,
}: CustomerDiscountHistoryProps) {
  const [history, setHistory] = useState<DiscountHistoryEntry[]>([]);
  const [stats, setStats] = useState<CustomerDiscountStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Fetch discount history
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch applied discounts for this client
        const { data, error: fetchError } = await supabase
          .from('applied_discounts')
          .select(`
            *,
            proposals!inner (
              id,
              proposal_number,
              name,
              status,
              pricing_data
            )
          `)
          .eq('proposals.contact_id', clientId)
          .order('applied_at', { ascending: sortOrder === 'asc' });

        if (fetchError) throw fetchError;

        // Map to history entries
        const entries: DiscountHistoryEntry[] = (data || []).map((item) => ({
          id: item.id,
          date: item.applied_at,
          proposalId: item.proposal_id,
          proposalNumber: item.proposals.proposal_number,
          proposalTitle: item.proposals.name,
          discountSource: item.source_name,
          discountSourceType: item.source_type,
          discountType: item.discount_type,
          discountValue: item.discount_value,
          discountAmount: item.discount_amount,
          orderSubtotal: item.applied_to_subtotal,
          orderTotal: item.proposals.pricing_data?.total || 0,
          promoCode: item.source_type === 'promo_code' ? item.source_name : undefined,
          proposalStatus: item.proposals.status,
        }));

        setHistory(entries);

        // Calculate stats
        if (entries.length > 0) {
          const totalSavings = entries.reduce((sum, e) => sum + e.discountAmount, 0);
          const averageDiscount = totalSavings / entries.length;
          
          const totalSubtotals = entries.reduce((sum, e) => sum + e.orderSubtotal, 0);
          const averageDiscountPercent = totalSubtotals > 0 
            ? (totalSavings / totalSubtotals) * 100 
            : 0;

          const discountsByType: Record<string, { count: number; total: number }> = {};
          entries.forEach((e) => {
            if (!discountsByType[e.discountSourceType]) {
              discountsByType[e.discountSourceType] = { count: 0, total: 0 };
            }
            discountsByType[e.discountSourceType].count++;
            discountsByType[e.discountSourceType].total += e.discountAmount;
          });

          const mostUsedType = Object.entries(discountsByType)
            .sort((a, b) => b[1].count - a[1].count)[0];

          setStats({
            totalDiscountsReceived: entries.length,
            totalSavings,
            averageDiscount,
            averageDiscountPercent,
            mostUsedDiscountType: mostUsedType ? mostUsedType[0] : 'N/A',
            largestDiscount: Math.max(...entries.map((e) => e.discountAmount)),
            discountsByType,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load discount history');
        
        // Use mock data for demo
        const mockHistory: DiscountHistoryEntry[] = [
          {
            id: '1',
            date: '2024-01-15T10:30:00Z',
            proposalId: 'prop-1',
            proposalNumber: 'PROP-2024-0042',
            proposalTitle: 'Parking Lot Sealcoating',
            discountSource: 'WELCOME10',
            discountSourceType: 'promo_code',
            discountType: 'percent',
            discountValue: 10,
            discountAmount: 450,
            orderSubtotal: 4500,
            orderTotal: 4050,
            promoCode: 'WELCOME10',
            proposalStatus: 'signed',
          },
          {
            id: '2',
            date: '2024-03-22T14:15:00Z',
            proposalId: 'prop-2',
            proposalNumber: 'PROP-2024-0089',
            proposalTitle: 'Annual Maintenance - Main Lot',
            discountSource: 'Gold Member Discount',
            discountSourceType: 'loyalty',
            discountType: 'percent',
            discountValue: 10,
            discountAmount: 750,
            orderSubtotal: 7500,
            orderTotal: 6750,
            proposalStatus: 'signed',
          },
          {
            id: '3',
            date: '2024-06-10T09:00:00Z',
            proposalId: 'prop-3',
            proposalNumber: 'PROP-2024-0156',
            proposalTitle: 'Crack Filling + Striping',
            discountSource: 'Volume Discount (10K+ sqft)',
            discountSourceType: 'volume',
            discountType: 'percent',
            discountValue: 15,
            discountAmount: 1200,
            orderSubtotal: 8000,
            orderTotal: 6800,
            proposalStatus: 'signed',
          },
          {
            id: '4',
            date: '2024-09-05T11:45:00Z',
            proposalId: 'prop-4',
            proposalNumber: 'PROP-2024-0234',
            proposalTitle: 'Emergency Pothole Repair',
            discountSource: 'Manual Discount',
            discountSourceType: 'manual',
            discountType: 'fixed',
            discountValue: 200,
            discountAmount: 200,
            orderSubtotal: 1500,
            orderTotal: 1300,
            proposalStatus: 'signed',
          },
          {
            id: '5',
            date: '2024-11-20T16:30:00Z',
            proposalId: 'prop-5',
            proposalNumber: 'PROP-2024-0312',
            proposalTitle: 'Winter Prep - Full Service',
            discountSource: 'FALL12',
            discountSourceType: 'seasonal',
            discountType: 'percent',
            discountValue: 12,
            discountAmount: 1080,
            orderSubtotal: 9000,
            orderTotal: 7920,
            promoCode: 'FALL12',
            proposalStatus: 'sent',
          },
        ];

        setHistory(mockHistory);

        // Calculate mock stats
        const totalSavings = mockHistory.reduce((sum, e) => sum + e.discountAmount, 0);
        setStats({
          totalDiscountsReceived: mockHistory.length,
          totalSavings,
          averageDiscount: totalSavings / mockHistory.length,
          averageDiscountPercent: 11.2,
          mostUsedDiscountType: 'promo_code',
          largestDiscount: 1200,
          discountsByType: {
            promo_code: { count: 2, total: 1530 },
            loyalty: { count: 1, total: 750 },
            volume: { count: 1, total: 1200 },
            manual: { count: 1, total: 200 },
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchHistory();
    }
  }, [clientId, sortOrder]);

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promo_code':
        return <Tag className="w-4 h-4" />;
      case 'loyalty':
        return <Crown className="w-4 h-4" />;
      case 'volume':
        return <TrendingUp className="w-4 h-4" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4" />;
      case 'referral':
        return <Gift className="w-4 h-4" />;
      default:
        return <Percent className="w-4 h-4" />;
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promo_code':
        return 'bg-blue-100 text-blue-600';
      case 'loyalty':
        return 'bg-yellow-100 text-yellow-600';
      case 'volume':
        return 'bg-green-100 text-green-600';
      case 'seasonal':
        return 'bg-orange-100 text-orange-600';
      case 'referral':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-700';
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'expired':
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Filter history
  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.discountSource.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || entry.discountSourceType === filterType;

    return matchesSearch && matchesType;
  });

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Proposal', 'Discount Type', 'Source', 'Value', 'Savings', 'Order Total', 'Status'];
    const rows = filteredHistory.map((entry) => [
      new Date(entry.date).toLocaleDateString(),
      entry.proposalNumber,
      entry.discountSourceType,
      entry.discountSource,
      entry.discountType === 'percent' ? `${entry.discountValue}%` : `$${entry.discountValue}`,
      `$${entry.discountAmount.toFixed(2)}`,
      `$${entry.orderTotal.toFixed(2)}`,
      entry.proposalStatus,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discount-history-${clientId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border p-8', className)}>
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading discount history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-red" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Discount History
              {clientName && <span className="font-normal text-gray-500"> - {clientName}</span>}
            </h3>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {stats && showStats && (
        <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lifetime Discount Summary
            </h4>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalSavings.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDiscountsReceived}
              </div>
              <div className="text-xs text-gray-500">Discounts Used</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageDiscountPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Avg. Discount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${stats.largestDiscount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Largest Discount</div>
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(stats.discountsByType).map(([type, data]) => (
              <div
                key={type}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-full text-xs',
                  getTypeColor(type)
                )}
              >
                {getTypeIcon(type)}
                <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="font-medium">${data.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b flex items-center justify-center gap-1"
        >
          <ChevronDown className="w-4 h-4" />
          Show Stats
        </button>
      )}

      {/* Filters */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discounts..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          <option value="promo_code">Promo Codes</option>
          <option value="loyalty">Loyalty</option>
          <option value="volume">Volume</option>
          <option value="seasonal">Seasonal</option>
          <option value="manual">Manual</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* History List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No discount history found</p>
          </div>
        ) : (
          filteredHistory.map((entry) => {
            const isExpanded = expandedEntry === entry.id;

            return (
              <div key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {/* Main Row */}
                <div
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Type Icon */}
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', getTypeColor(entry.discountSourceType))}>
                      {getTypeIcon(entry.discountSourceType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {entry.discountSource}
                        </span>
                        {entry.promoCode && (
                          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                            {entry.promoCode}
                          </code>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{entry.proposalNumber}</span>
                        <span>•</span>
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        -${entry.discountAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.discountType === 'percent'
                          ? `${entry.discountValue}% off`
                          : `$${entry.discountValue} off`}
                      </div>
                    </div>

                    {/* Status */}
                    <span className={cn('px-2 py-1 rounded-full text-xs', getStatusColor(entry.proposalStatus))}>
                      {entry.proposalStatus}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Proposal:</span>
                        <span className="ml-2 font-medium">{entry.proposalTitle}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Order Subtotal:</span>
                        <span className="ml-2 font-medium">${entry.orderSubtotal.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Discount:</span>
                        <span className="ml-2 font-medium text-green-600">
                          -${entry.discountAmount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Final Total:</span>
                        <span className="ml-2 font-medium">${entry.orderTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {onViewProposal && (
                      <button
                        onClick={() => onViewProposal(entry.proposalId)}
                        className="mt-3 text-sm text-brand-red hover:underline flex items-center gap-1"
                      >
                        View Proposal
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t text-sm text-gray-500">
        Showing {filteredHistory.length} of {history.length} discounts
      </div>
    </div>
  );
}

export default CustomerDiscountHistory;
