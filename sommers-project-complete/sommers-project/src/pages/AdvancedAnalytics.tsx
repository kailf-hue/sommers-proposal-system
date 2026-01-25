/**
 * Sommer's Proposal System - Advanced Analytics Page
 * Phase 43: Deep analytics, cohort analysis, and business intelligence
 */

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Clock,
  Zap,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface PerformanceMetrics {
  revenue: number;
  revenueChange: number;
  proposals: number;
  proposalsChange: number;
  winRate: number;
  winRateChange: number;
  avgDealSize: number;
  avgDealSizeChange: number;
  cycleTime: number;
  cycleTimeChange: number;
}

interface CohortData {
  cohort: string;
  size: number;
  retention: { month: number; rate: number }[];
  ltv: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface SeasonalTrend {
  month: string;
  index: number;
  recommendation: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPerformance: PerformanceMetrics = {
  revenue: 285000,
  revenueChange: 18.5,
  proposals: 47,
  proposalsChange: 12.3,
  winRate: 42,
  winRateChange: 5.2,
  avgDealSize: 15200,
  avgDealSizeChange: -3.1,
  cycleTime: 14,
  cycleTimeChange: -2.5,
};

const mockCohorts: CohortData[] = [
  { cohort: 'Oct \'25', size: 28, retention: [{ month: 0, rate: 100 }, { month: 1, rate: 85 }, { month: 2, rate: 72 }, { month: 3, rate: 65 }], ltv: 12500 },
  { cohort: 'Nov \'25', size: 32, retention: [{ month: 0, rate: 100 }, { month: 1, rate: 88 }, { month: 2, rate: 75 }], ltv: 14200 },
  { cohort: 'Dec \'25', size: 25, retention: [{ month: 0, rate: 100 }, { month: 1, rate: 82 }], ltv: 11800 },
  { cohort: 'Jan \'26', size: 35, retention: [{ month: 0, rate: 100 }], ltv: 0 },
];

const mockFunnel: FunnelStage[] = [
  { stage: 'Created', count: 156, value: 2340000, conversionRate: 100 },
  { stage: 'Sent', count: 124, value: 1860000, conversionRate: 79 },
  { stage: 'Viewed', count: 98, value: 1470000, conversionRate: 79 },
  { stage: 'Engaged', count: 72, value: 1080000, conversionRate: 73 },
  { stage: 'Won', count: 47, value: 705000, conversionRate: 65 },
];

const mockRevenueByService = [
  { service: 'Sealcoating', revenue: 156000, percentage: 55 },
  { service: 'Crack Filling', revenue: 71000, percentage: 25 },
  { service: 'Line Striping', revenue: 42700, percentage: 15 },
  { service: 'Other', revenue: 14200, percentage: 5 },
];

const mockRevenueByMonth = [
  { month: 'Sep', revenue: 42000, target: 45000 },
  { month: 'Oct', revenue: 48000, target: 45000 },
  { month: 'Nov', revenue: 52000, target: 50000 },
  { month: 'Dec', revenue: 38000, target: 50000 },
  { month: 'Jan', revenue: 55000, target: 55000 },
  { month: 'Feb', revenue: 50000, target: 55000 },
];

const mockSeasonality = [
  { month: 'Jan', index: 40, recommendation: 'Slow season - focus on planning' },
  { month: 'Feb', index: 50, recommendation: 'Slow season - focus on planning' },
  { month: 'Mar', index: 80, recommendation: 'Moderate - balance prospecting' },
  { month: 'Apr', index: 110, recommendation: 'Strong season - push closing' },
  { month: 'May', index: 130, recommendation: 'Peak season - maximize capacity' },
  { month: 'Jun', index: 140, recommendation: 'Peak season - maximize capacity' },
  { month: 'Jul', index: 150, recommendation: 'Peak season - maximize capacity' },
  { month: 'Aug', index: 140, recommendation: 'Peak season - maximize capacity' },
  { month: 'Sep', index: 120, recommendation: 'Strong season - push closing' },
  { month: 'Oct', index: 90, recommendation: 'Moderate - balance prospecting' },
  { month: 'Nov', index: 60, recommendation: 'Slow season - focus on planning' },
  { month: 'Dec', index: 40, recommendation: 'Slow season - focus on planning' },
];

const mockProposalAnalytics = {
  avgViewsPerProposal: 3.2,
  avgTimeToFirstView: 4.5,
  contentEngagement: [
    { section: 'Cover Letter', avgTime: 45, completion: 95 },
    { section: 'Scope of Work', avgTime: 120, completion: 88 },
    { section: 'Pricing', avgTime: 180, completion: 92 },
    { section: 'Terms', avgTime: 60, completion: 75 },
    { section: 'About Us', avgTime: 30, completion: 65 },
  ],
  optimalSendTime: [
    { day: 'Tuesday', hour: '10 AM', winRate: 48 },
    { day: 'Wednesday', hour: '2 PM', winRate: 45 },
    { day: 'Thursday', hour: '9 AM', winRate: 42 },
  ],
  discountImpact: [
    { range: 'No discount', usage: 40, winRate: 32 },
    { range: '1-5%', usage: 25, winRate: 45 },
    { range: '6-10%', usage: 20, winRate: 52 },
    { range: '11-15%', usage: 10, winRate: 48 },
    { range: '15%+', usage: 5, winRate: 38 },
  ],
};

const mockLifecycleData = [
  { name: 'New', value: 35, color: '#3B82F6' },
  { name: 'Active', value: 156, color: '#10B981' },
  { name: 'At Risk', value: 28, color: '#F59E0B' },
  { name: 'Churned', value: 12, color: '#EF4444' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdvancedAnalytics() {
  const { organization } = useAuth();
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPerformance(mockPerformance);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-red" />
            Advanced Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Deep insights and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Revenue"
            value={formatCurrency(performance.revenue)}
            change={performance.revenueChange}
            icon={DollarSign}
          />
          <MetricCard
            label="Proposals"
            value={performance.proposals}
            change={performance.proposalsChange}
            icon={FileText}
          />
          <MetricCard
            label="Win Rate"
            value={`${performance.winRate}%`}
            change={performance.winRateChange}
            icon={Target}
          />
          <MetricCard
            label="Avg Deal Size"
            value={formatCurrency(performance.avgDealSize)}
            change={performance.avgDealSizeChange}
            icon={TrendingUp}
          />
          <MetricCard
            label="Cycle Time"
            value={`${performance.cycleTime}d`}
            change={performance.cycleTimeChange}
            invertChange
            icon={Clock}
          />
        </div>
      )}

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel" className="gap-2">
            <Layers className="w-4 h-4" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="cohort" className="gap-2">
            <Users className="w-4 h-4" />
            Cohorts
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="gap-2">
            <Calendar className="w-4 h-4" />
            Seasonality
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <FileText className="w-4 h-4" />
            Proposals
          </TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Deal progression through stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFunnel.map((stage, index) => (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{stage.stage}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">{stage.count} deals</span>
                          <span className="font-semibold">{formatCurrency(stage.value)}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={stage.conversionRate} className="h-8" />
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                          {stage.conversionRate}% conversion
                        </div>
                      </div>
                      {index < mockFunnel.length - 1 && (
                        <div className="flex justify-center my-2">
                          <div className={cn(
                            'text-xs px-2 py-1 rounded',
                            mockFunnel[index + 1].conversionRate >= 70
                              ? 'bg-green-100 text-green-700'
                              : mockFunnel[index + 1].conversionRate >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          )}>
                            {mockFunnel[index + 1].conversionRate}% →
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifecycle</CardTitle>
                <CardDescription>Distribution by customer status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="h-64 w-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockLifecycleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {mockLifecycleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-4">
                    {mockLifecycleData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-4 border-t dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Net Revenue Retention</span>
                        <span className="font-semibold text-green-600">105%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockRevenueByService}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="revenue"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {mockRevenueByService.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#C41E3A', '#3B82F6', '#10B981', '#F59E0B'][index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockRevenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}K`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#C41E3A" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" name="Target" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohort" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Customer retention by acquisition month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cohort</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Size</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Month 0</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Month 1</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Month 2</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Month 3</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCohorts.map((cohort) => (
                      <tr key={cohort.cohort} className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{cohort.cohort}</td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{cohort.size}</td>
                        {[0, 1, 2, 3].map((month) => {
                          const retention = cohort.retention.find((r) => r.month === month);
                          return (
                            <td key={month} className="py-3 px-4 text-center">
                              {retention ? (
                                <span className={cn(
                                  'inline-block px-2 py-1 rounded text-xs font-medium',
                                  retention.rate >= 80 ? 'bg-green-100 text-green-700' :
                                  retention.rate >= 60 ? 'bg-blue-100 text-blue-700' :
                                  retention.rate >= 40 ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                )}>
                                  {retention.rate}%
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {cohort.ltv > 0 ? formatCurrency(cohort.ltv) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonality */}
        <TabsContent value="seasonal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Performance Index</CardTitle>
              <CardDescription>Monthly performance patterns (100 = average)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockSeasonality}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 160]} />
                    <Tooltip />
                    <Bar dataKey="index" radius={[4, 4, 0, 0]}>
                      {mockSeasonality.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.index >= 120 ? '#22C55E' : entry.index >= 80 ? '#3B82F6' : entry.index >= 50 ? '#F59E0B' : '#EF4444'}
                        />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey={() => 100} stroke="#6B7280" strokeDasharray="5 5" name="Average" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <SeasonLegend color="#22C55E" label="Peak Season" description="120+ index" />
                <SeasonLegend color="#3B82F6" label="Strong Season" description="80-120 index" />
                <SeasonLegend color="#F59E0B" label="Moderate" description="50-80 index" />
                <SeasonLegend color="#EF4444" label="Slow Season" description="<50 index" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposal Analytics */}
        <TabsContent value="proposals" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Engagement</CardTitle>
                <CardDescription>Time spent on each proposal section</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProposalAnalytics.contentEngagement.map((section) => (
                    <div key={section.section}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{section.section}</span>
                        <span className="text-sm text-gray-500">{section.avgTime}s avg</span>
                      </div>
                      <Progress value={section.completion} className="h-2" />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-400">{section.completion}% view completion</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount Impact on Win Rate</CardTitle>
                <CardDescription>How discounts affect deal closure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockProposalAnalytics.discountImpact} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis type="number" domain={[0, 60]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="range" width={80} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="winRate" fill="#C41E3A" name="Win Rate" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Optimal Send Times</CardTitle>
                <CardDescription>Best times to send proposals for highest win rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  {mockProposalAnalytics.optimalSendTime.map((time, index) => (
                    <div key={index} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-brand-red/10 text-brand-red">
                        {index === 0 ? <Award className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{time.day}</p>
                      <p className="text-gray-500">{time.hour}</p>
                      <p className="mt-2 text-sm font-semibold text-green-600">{time.winRate}% win rate</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  invertChange = false,
}: {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  invertChange?: boolean;
}) {
  const isPositive = invertChange ? change < 0 : change > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </CardContent>
    </Card>
  );
}

function SeasonLegend({ color, label, description }: { color: string; label: string; description: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
