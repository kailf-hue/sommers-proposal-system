/**
 * Sommer's Proposal System - Pipeline Forecasting Page
 * Phase 42: Sales forecasting, pipeline analytics, and predictions
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
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
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface ForecastSummary {
  totalPipeline: number;
  weightedPipeline: number;
  expectedClose: number;
  bestCase: number;
  worstCase: number;
  winProbability: number;
  dealsInPipeline: number;
  dealsClosingThisMonth: number;
  averageCycleTime: number;
}

interface StageForecast {
  stage: string;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
  conversionRate: number;
  color: string;
}

interface MonthlyForecast {
  month: string;
  expectedValue: number;
  weightedValue: number;
  closedValue: number;
  target: number;
}

interface RepForecast {
  repName: string;
  totalPipeline: number;
  weightedPipeline: number;
  dealCount: number;
  winRate: number;
  quota: number;
  quotaAttainment: number;
}

interface ForecastDeal {
  id: string;
  proposalNumber: string;
  clientName: string;
  value: number;
  stage: string;
  probability: number;
  weightedValue: number;
  expectedCloseDate: string;
  daysInStage: number;
  repName: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ForecastScenario {
  name: string;
  probability: number;
  value: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSummary: ForecastSummary = {
  totalPipeline: 847500,
  weightedPipeline: 423750,
  expectedClose: 325000,
  bestCase: 847500,
  worstCase: 212000,
  winProbability: 42,
  dealsInPipeline: 34,
  dealsClosingThisMonth: 8,
  averageCycleTime: 18,
};

const mockStages: StageForecast[] = [
  { stage: 'Lead', dealCount: 12, totalValue: 180000, weightedValue: 18000, conversionRate: 45, color: '#6B7280' },
  { stage: 'Qualified', dealCount: 8, totalValue: 240000, weightedValue: 60000, conversionRate: 55, color: '#3B82F6' },
  { stage: 'Proposal Sent', dealCount: 6, totalValue: 195000, weightedValue: 97500, conversionRate: 65, color: '#8B5CF6' },
  { stage: 'Negotiation', dealCount: 5, totalValue: 162500, weightedValue: 121875, conversionRate: 78, color: '#F59E0B' },
  { stage: 'Verbal Commit', dealCount: 3, totalValue: 70000, weightedValue: 63000, conversionRate: 92, color: '#10B981' },
];

const mockMonthlyForecast: MonthlyForecast[] = [
  { month: 'Feb', expectedValue: 125000, weightedValue: 62500, closedValue: 0, target: 100000 },
  { month: 'Mar', expectedValue: 185000, weightedValue: 92500, closedValue: 0, target: 100000 },
  { month: 'Apr', expectedValue: 210000, weightedValue: 105000, closedValue: 0, target: 120000 },
  { month: 'May', expectedValue: 165000, weightedValue: 82500, closedValue: 0, target: 120000 },
  { month: 'Jun', expectedValue: 145000, weightedValue: 72500, closedValue: 0, target: 100000 },
  { month: 'Jul', expectedValue: 120000, weightedValue: 60000, closedValue: 0, target: 100000 },
];

const mockRepForecast: RepForecast[] = [
  { repName: 'John Smith', totalPipeline: 285000, weightedPipeline: 142500, dealCount: 12, winRate: 48, quota: 150000, quotaAttainment: 85 },
  { repName: 'Sarah Johnson', totalPipeline: 225000, weightedPipeline: 112500, dealCount: 9, winRate: 52, quota: 125000, quotaAttainment: 72 },
  { repName: 'Mike Brown', totalPipeline: 187500, weightedPipeline: 93750, dealCount: 8, winRate: 45, quota: 100000, quotaAttainment: 95 },
  { repName: 'Emily Davis', totalPipeline: 150000, weightedPipeline: 75000, dealCount: 5, winRate: 55, quota: 100000, quotaAttainment: 65 },
];

const mockDeals: ForecastDeal[] = [
  { id: '1', proposalNumber: 'SOM-2026-0156', clientName: 'Acme Corp', value: 75000, stage: 'Verbal Commit', probability: 90, weightedValue: 67500, expectedCloseDate: '2026-02-05', daysInStage: 5, repName: 'John Smith', riskLevel: 'low' },
  { id: '2', proposalNumber: 'SOM-2026-0155', clientName: 'Smith Properties', value: 62500, stage: 'Negotiation', probability: 75, weightedValue: 46875, expectedCloseDate: '2026-02-12', daysInStage: 8, repName: 'Sarah Johnson', riskLevel: 'low' },
  { id: '3', proposalNumber: 'SOM-2026-0154', clientName: 'Downtown Mall', value: 95000, stage: 'Negotiation', probability: 75, weightedValue: 71250, expectedCloseDate: '2026-02-20', daysInStage: 15, repName: 'John Smith', riskLevel: 'medium' },
  { id: '4', proposalNumber: 'SOM-2026-0152', clientName: 'Tech Park Inc', value: 45000, stage: 'Proposal Sent', probability: 50, weightedValue: 22500, expectedCloseDate: '2026-02-28', daysInStage: 12, repName: 'Mike Brown', riskLevel: 'medium' },
  { id: '5', proposalNumber: 'SOM-2026-0150', clientName: 'Harbor View', value: 38000, stage: 'Proposal Sent', probability: 50, weightedValue: 19000, expectedCloseDate: '2026-03-05', daysInStage: 22, repName: 'Emily Davis', riskLevel: 'high' },
];

const mockScenarios: ForecastScenario[] = [
  { name: 'Best Case', probability: 15, value: 847500 },
  { name: 'Most Likely', probability: 60, value: 423750 },
  { name: 'Worst Case', probability: 25, value: 212000 },
];

const mockTrends = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  pipeline: 750000 + Math.sin(i / 5) * 100000 + Math.random() * 50000,
  weighted: 375000 + Math.sin(i / 5) * 50000 + Math.random() * 25000,
}));

// ============================================================================
// COMPONENT
// ============================================================================

export default function PipelineForecasting() {
  const { organization } = useAuth();
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [stages, setStages] = useState<StageForecast[]>([]);
  const [monthlyForecast, setMonthlyForecast] = useState<MonthlyForecast[]>([]);
  const [repForecast, setRepForecast] = useState<RepForecast[]>([]);
  const [deals, setDeals] = useState<ForecastDeal[]>([]);
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forecastPeriod, setForecastPeriod] = useState('quarter');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary(mockSummary);
      setStages(mockStages);
      setMonthlyForecast(mockMonthlyForecast);
      setRepForecast(mockRepForecast);
      setDeals(mockDeals);
      setScenarios(mockScenarios);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ForecastingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-brand-red" />
            Pipeline Forecasting
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Revenue predictions and deal analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Pipeline"
            value={formatCurrency(summary.totalPipeline)}
            subtext={`${summary.dealsInPipeline} deals`}
            icon={DollarSign}
            color="blue"
          />
          <SummaryCard
            label="Weighted Pipeline"
            value={formatCurrency(summary.weightedPipeline)}
            subtext="Probability-adjusted"
            icon={Target}
            color="purple"
          />
          <SummaryCard
            label="Expected Close"
            value={formatCurrency(summary.expectedClose)}
            subtext={`${summary.dealsClosingThisMonth} deals this month`}
            icon={Calendar}
            color="green"
          />
          <SummaryCard
            label="Win Probability"
            value={`${summary.winProbability}%`}
            subtext={`Avg. cycle: ${summary.averageCycleTime} days`}
            icon={Zap}
            color="amber"
          />
        </div>
      )}

      {/* Forecast Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Scenarios</CardTitle>
          <CardDescription>Revenue projections based on different outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.name} scenario={scenario} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stages">
        <TabsList>
          <TabsTrigger value="stages" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            By Stage
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="reps" className="gap-2">
            <Users className="w-4 h-4" />
            By Rep
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-2">
            <Target className="w-4 h-4" />
            Deals
          </TabsTrigger>
        </TabsList>

        {/* By Stage */}
        <TabsContent value="stages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis type="number" tickFormatter={(v) => `$${v / 1000}K`} />
                      <YAxis type="category" dataKey="stage" width={100} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="totalValue" fill="#E5E7EB" name="Total Value" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="weightedValue" fill="#C41E3A" name="Weighted Value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stage Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stages.map((stage) => (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                          <span className="font-medium text-gray-900 dark:text-white">{stage.stage}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">{stage.dealCount} deals</span>
                          <span className="font-semibold">{formatCurrency(stage.totalValue)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(stage.weightedValue / stage.totalValue) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {stage.conversionRate}% conv.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyForecast}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}K`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="expectedValue" fill="#E5E7EB" name="Expected" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="weightedValue" fill="#C41E3A" name="Weighted" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" name="Target" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="date" interval={6} />
                      <YAxis tickFormatter={(v) => `$${v / 1000}K`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="pipeline" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Pipeline" />
                      <Area type="monotone" dataKey="weighted" stroke="#C41E3A" fill="#C41E3A" fillOpacity={0.2} name="Weighted" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Rep */}
        <TabsContent value="reps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Rep Performance</CardTitle>
              <CardDescription>Pipeline and quota attainment by rep</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {repForecast.map((rep) => (
                  <RepForecastCard key={rep.repName} rep={rep} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals */}
        <TabsContent value="deals" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pipeline Deals</CardTitle>
                  <CardDescription>Active deals with forecasted close dates</CardDescription>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deal</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Value</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Stage</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Prob.</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Weighted</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Close Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 dark:text-white">{deal.proposalNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-900 dark:text-white">{deal.clientName}</p>
                            <p className="text-xs text-gray-500">{deal.repName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{deal.stage}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            'font-semibold',
                            deal.probability >= 75 ? 'text-green-600' : deal.probability >= 50 ? 'text-amber-600' : 'text-gray-600'
                          )}>
                            {deal.probability}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(deal.weightedValue)}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                          {new Date(deal.expectedCloseDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <RiskBadge level={deal.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SummaryCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ScenarioCard({ scenario }: { scenario: ForecastScenario }) {
  const config = {
    'Best Case': { icon: ArrowUpRight, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    'Most Likely': { icon: Target, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    'Worst Case': { icon: ArrowDownRight, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  }[scenario.name] || { icon: Target, color: 'text-gray-600 bg-gray-100' };

  const Icon = config.icon;

  return (
    <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className={cn('w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center', config.color)}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{scenario.name}</h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
        {formatCurrency(scenario.value)}
      </p>
      <p className="text-sm text-gray-500 mt-1">{scenario.probability}% probability</p>
    </div>
  );
}

function RepForecastCard({ rep }: { rep: RepForecast }) {
  const quotaColor = rep.quotaAttainment >= 100 ? 'text-green-600' : rep.quotaAttainment >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex items-center gap-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-semibold">
        {rep.repName.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 grid grid-cols-5 gap-4">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{rep.repName}</p>
          <p className="text-xs text-gray-500">{rep.dealCount} deals</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Pipeline</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(rep.totalPipeline)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Weighted</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(rep.weightedPipeline)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="font-semibold text-gray-900 dark:text-white">{rep.winRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Quota</p>
          <div className="flex items-center gap-2">
            <Progress value={rep.quotaAttainment} className="h-2 w-20" />
            <span className={cn('text-sm font-semibold', quotaColor)}>{rep.quotaAttainment}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    medium: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    high: { color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const { color, icon: Icon } = config[level];

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', color)}>
      <Icon className="w-3 h-3" />
      {level}
    </span>
  );
}

function ForecastingSkeleton() {
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
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
