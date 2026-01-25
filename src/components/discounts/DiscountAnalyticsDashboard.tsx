/**
 * Sommer's Proposal System - Discount Analytics Dashboard
 * Comprehensive analytics and charts for discount performance
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Tag,
  Users,
  Crown,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Award,
  Clock,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface DiscountAnalyticsData {
  // Overview metrics
  totalDiscountsGiven: number;
  totalDiscountAmount: number;
  averageDiscountPercent: number;
  discountedProposalsCount: number;
  totalProposalsCount: number;
  discountUsageRate: number;
  
  // Comparisons (vs previous period)
  discountAmountChange: number;
  usageRateChange: number;
  avgDiscountChange: number;
  
  // By type breakdown
  discountsByType: {
    type: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }[];
  
  // Over time
  discountTrend: {
    date: string;
    discountAmount: number;
    proposalCount: number;
    avgDiscount: number;
  }[];
  
  // Code performance
  topCodes: {
    code: string;
    name: string;
    timesUsed: number;
    totalDiscount: number;
    conversionRate: number;
  }[];
  
  // Loyalty metrics
  loyaltyMetrics: {
    totalMembers: number;
    activeMembers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    redemptionRate: number;
    tierDistribution: { tier: string; count: number }[];
  };
  
  // Win rate impact
  winRateImpact: {
    withDiscount: number;
    withoutDiscount: number;
    improvement: number;
  };
  
  // ROI metrics
  roiMetrics: {
    revenueFromDiscountedDeals: number;
    totalDiscountsGiven: number;
    netRevenue: number;
    roi: number;
  };
}

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DiscountAnalyticsDashboardProps {
  orgId: string;
  className?: string;
}

export function DiscountAnalyticsDashboard({ orgId, className }: DiscountAnalyticsDashboardProps) {
  const [data, setData] = useState<DiscountAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
    label: 'Last 30 Days',
  });
  const [selectedMetric, setSelectedMetric] = useState<'amount' | 'count' | 'rate'>('amount');

  // Date range presets
  const dateRangePresets: DateRange[] = [
    {
      start: new Date(new Date().setDate(new Date().getDate() - 7)),
      end: new Date(),
      label: 'Last 7 Days',
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      label: 'Last 30 Days',
    },
    {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      end: new Date(),
      label: 'Last 90 Days',
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
      label: 'Year to Date',
    },
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // In production, this would fetch from Supabase
        // For now, using mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData: DiscountAnalyticsData = {
          totalDiscountsGiven: 847,
          totalDiscountAmount: 156420,
          averageDiscountPercent: 12.4,
          discountedProposalsCount: 523,
          totalProposalsCount: 892,
          discountUsageRate: 58.6,
          discountAmountChange: 12.3,
          usageRateChange: 5.2,
          avgDiscountChange: -1.8,
          discountsByType: [
            { type: 'promo_code', count: 312, totalAmount: 58400, avgAmount: 187 },
            { type: 'loyalty', count: 198, totalAmount: 42300, avgAmount: 214 },
            { type: 'volume', count: 156, totalAmount: 35200, avgAmount: 226 },
            { type: 'seasonal', count: 89, totalAmount: 12800, avgAmount: 144 },
            { type: 'manual', count: 67, totalAmount: 5420, avgAmount: 81 },
            { type: 'referral', count: 25, totalAmount: 2300, avgAmount: 92 },
          ],
          discountTrend: generateTrendData(30),
          topCodes: [
            { code: 'WELCOME10', name: 'New Customer Welcome', timesUsed: 156, totalDiscount: 18720, conversionRate: 78 },
            { code: 'SPRING2024', name: 'Spring Special', timesUsed: 89, totalDiscount: 12450, conversionRate: 65 },
            { code: 'LOYALTY15', name: 'Loyalty Reward', timesUsed: 67, totalDiscount: 8940, conversionRate: 82 },
            { code: 'REFER20', name: 'Referral Bonus', timesUsed: 45, totalDiscount: 6750, conversionRate: 71 },
            { code: 'BULK10', name: 'Bulk Discount', timesUsed: 34, totalDiscount: 5100, conversionRate: 88 },
          ],
          loyaltyMetrics: {
            totalMembers: 1247,
            activeMembers: 892,
            pointsIssued: 2450000,
            pointsRedeemed: 1680000,
            redemptionRate: 68.6,
            tierDistribution: [
              { tier: 'Bronze', count: 645 },
              { tier: 'Silver', count: 389 },
              { tier: 'Gold', count: 167 },
              { tier: 'Platinum', count: 46 },
            ],
          },
          winRateImpact: {
            withDiscount: 72.4,
            withoutDiscount: 58.2,
            improvement: 14.2,
          },
          roiMetrics: {
            revenueFromDiscountedDeals: 1245600,
            totalDiscountsGiven: 156420,
            netRevenue: 1089180,
            roi: 696,
          },
        };

        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [orgId, dateRange]);

  // Generate mock trend data
  function generateTrendData(days: number) {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        discountAmount: 3000 + Math.random() * 5000,
        proposalCount: 15 + Math.floor(Math.random() * 20),
        avgDiscount: 10 + Math.random() * 8,
      });
    }
    return data;
  }

  // Colors
  const COLORS = ['#C41E3A', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'];
  const TYPE_COLORS: Record<string, string> = {
    promo_code: '#3B82F6',
    loyalty: '#F59E0B',
    volume: '#22C55E',
    seasonal: '#EC4899',
    manual: '#6B7280',
    referral: '#8B5CF6',
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discount Analytics</h2>
          <p className="text-gray-500">Track discount performance and ROI</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange.label}
              onChange={(e) => {
                const preset = dateRangePresets.find((p) => p.label === e.target.value);
                if (preset) setDateRange(preset);
              }}
              className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white"
            >
              {dateRangePresets.map((preset) => (
                <option key={preset.label} value={preset.label}>
                  {preset.label}
                </option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Total Discounts Given"
          value={`$${data.totalDiscountAmount.toLocaleString()}`}
          change={data.discountAmountChange}
          icon={<DollarSign className="w-5 h-5" />}
          color="red"
        />
        <MetricCard
          label="Discounts Applied"
          value={data.totalDiscountsGiven.toLocaleString()}
          change={8.5}
          icon={<Tag className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          label="Avg Discount"
          value={`${data.averageDiscountPercent.toFixed(1)}%`}
          change={data.avgDiscountChange}
          icon={<Percent className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Usage Rate"
          value={`${data.discountUsageRate.toFixed(1)}%`}
          change={data.usageRateChange}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          label="Win Rate Impact"
          value={`+${data.winRateImpact.improvement.toFixed(1)}%`}
          change={3.2}
          icon={<Target className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          label="ROI"
          value={`${data.roiMetrics.roi}%`}
          change={15.4}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Discount Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Discount Trends</h3>
            <div className="flex gap-2">
              {(['amount', 'count', 'rate'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    selectedMetric === metric
                      ? 'bg-brand-red text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {metric === 'amount' ? 'Amount' : metric === 'count' ? 'Count' : 'Avg %'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.discountTrend}>
              <defs>
                <linearGradient id="colorDiscount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
                formatter={(value: number) =>
                  selectedMetric === 'amount'
                    ? `$${value.toFixed(0)}`
                    : selectedMetric === 'rate'
                    ? `${value.toFixed(1)}%`
                    : value
                }
              />
              <Area
                type="monotone"
                dataKey={
                  selectedMetric === 'amount'
                    ? 'discountAmount'
                    : selectedMetric === 'count'
                    ? 'proposalCount'
                    : 'avgDiscount'
                }
                stroke="#C41E3A"
                fill="url(#colorDiscount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Discounts by Type Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Discounts by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.discountsByType}
                dataKey="totalAmount"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.discountsByType.map((entry, index) => (
                  <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.discountsByType.slice(0, 4).map((type) => (
              <div key={type.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[type.type] }}
                  />
                  <span className="capitalize">{type.type.replace('_', ' ')}</span>
                </div>
                <span className="font-medium">${type.totalAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Promo Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Top Performing Codes</h3>
          <div className="space-y-4">
            {data.topCodes.map((code, index) => (
              <div key={code.code} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono font-bold">
                      {code.code}
                    </code>
                    <span className="text-sm text-gray-500 truncate">{code.name}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{code.timesUsed} uses</span>
                    <span>${code.totalDiscount.toLocaleString()} total</span>
                    <span className="text-green-600">{code.conversionRate}% conversion</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(code.totalDiscount / code.timesUsed).toFixed(0)}</div>
                  <div className="text-xs text-gray-500">avg/use</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win Rate Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Win Rate Impact</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: 'With Discount', rate: data.winRateImpact.withDiscount },
                { name: 'Without Discount', rate: data.winRateImpact.withoutDiscount },
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} unit="%" stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={120} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                <Cell fill="#22C55E" />
                <Cell fill="#9CA3AF" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">
              +{data.winRateImpact.improvement.toFixed(1)}%
            </div>
            <div className="text-sm text-green-700 dark:text-green-400">
              Higher win rate with discounts
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Loyalty Program Performance
        </h3>
        <div className="grid md:grid-cols-5 gap-6">
          {/* Key Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{data.loyaltyMetrics.totalMembers.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Members</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.loyaltyMetrics.activeMembers.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Active Members</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold">{(data.loyaltyMetrics.pointsIssued / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-500">Points Issued</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-brand-red">{data.loyaltyMetrics.redemptionRate}%</div>
              <div className="text-sm text-gray-500">Redemption Rate</div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Tier Distribution</h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data.loyaltyMetrics.tierDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="tier" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: 'white' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  <Cell fill="#92400e" />
                  <Cell fill="#9ca3af" />
                  <Cell fill="#fbbf24" />
                  <Cell fill="#1f2937" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Discount ROI Summary
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold">${(data.roiMetrics.revenueFromDiscountedDeals / 1000).toFixed(0)}K</div>
            <div className="text-sm opacity-80">Revenue from Discounted Deals</div>
          </div>
          <div>
            <div className="text-3xl font-bold">-${(data.roiMetrics.totalDiscountsGiven / 1000).toFixed(0)}K</div>
            <div className="text-sm opacity-80">Total Discounts Given</div>
          </div>
          <div>
            <div className="text-3xl font-bold">${(data.roiMetrics.netRevenue / 1000).toFixed(0)}K</div>
            <div className="text-sm opacity-80">Net Revenue</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold">{data.roiMetrics.roi}%</div>
            <div className="text-sm opacity-80">Return on Investment</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: 'red' | 'blue' | 'green' | 'purple' | 'amber' | 'emerald';
}

function MetricCard({ label, value, change, icon, color }: MetricCardProps) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
        <div
          className={cn(
            'flex items-center text-xs font-medium',
            change >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {change >= 0 ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default DiscountAnalyticsDashboard;
