/**
 * Sommer's Proposal System - AI Insights Page
 * Advanced AI-powered analytics and recommendations
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  metric?: { value: string; change?: number };
  action?: { label: string; href: string };
  priority: 'high' | 'medium' | 'low';
}

interface PricingRecommendation {
  serviceId: string;
  serviceName: string;
  currentPrice: number;
  recommendedPrice: number;
  confidence: number;
  reasoning: string;
}

interface WinProbability {
  proposalId: string;
  proposalNumber: string;
  clientName: string;
  probability: number;
  factors: { name: string; impact: 'positive' | 'negative' }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Optimal Proposal Timing',
    description: 'Proposals sent on Tuesdays have 34% higher acceptance rates. Consider scheduling more sends for early week.',
    metric: { value: '34%', change: 8 },
    action: { label: 'View Calendar', href: '/scheduling' },
    priority: 'high',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Follow-up Gap Detected',
    description: '12 proposals have been viewed but not followed up on in the last 7 days.',
    metric: { value: '12 proposals' },
    action: { label: 'View Proposals', href: '/proposals?status=viewed' },
    priority: 'high',
  },
  {
    id: '3',
    type: 'success',
    title: 'Win Rate Improvement',
    description: 'Your win rate has increased by 15% compared to last quarter. Premium tier proposals are performing best.',
    metric: { value: '68%', change: 15 },
    priority: 'medium',
  },
  {
    id: '4',
    type: 'info',
    title: 'Seasonal Trend Detected',
    description: 'Based on historical data, expect a 20% increase in quote requests next month. Prepare templates accordingly.',
    metric: { value: '+20% expected' },
    action: { label: 'View Templates', href: '/templates' },
    priority: 'medium',
  },
];

const mockPricingRecommendations: PricingRecommendation[] = [
  {
    serviceId: '1',
    serviceName: 'Standard Sealcoating',
    currentPrice: 0.22,
    recommendedPrice: 0.25,
    confidence: 87,
    reasoning: 'Market analysis shows competitors charging $0.24-0.28/sqft. Your win rate suggests room for increase.',
  },
  {
    serviceId: '2',
    serviceName: 'Crack Filling',
    currentPrice: 1.50,
    recommendedPrice: 1.75,
    confidence: 72,
    reasoning: 'Material costs have increased 12%. Adjusting price maintains your target margin.',
  },
  {
    serviceId: '3',
    serviceName: 'Premium Line Striping',
    currentPrice: 5.50,
    recommendedPrice: 5.25,
    confidence: 65,
    reasoning: 'Lower win rate on this service suggests price sensitivity. Small reduction may improve conversions.',
  },
];

const mockWinProbabilities: WinProbability[] = [
  {
    proposalId: '1',
    proposalNumber: 'SOM-2026-0156',
    clientName: 'Acme Corporation',
    probability: 85,
    factors: [
      { name: 'Repeat client', impact: 'positive' },
      { name: 'Within budget', impact: 'positive' },
      { name: 'Quick response time', impact: 'positive' },
    ],
  },
  {
    proposalId: '2',
    proposalNumber: 'SOM-2026-0155',
    clientName: 'Smith Properties',
    probability: 62,
    factors: [
      { name: 'New client', impact: 'negative' },
      { name: 'Competitive pricing', impact: 'positive' },
      { name: 'Viewed multiple times', impact: 'positive' },
    ],
  },
  {
    proposalId: '3',
    proposalNumber: 'SOM-2026-0154',
    clientName: 'Downtown Mall LLC',
    probability: 45,
    factors: [
      { name: 'Large project', impact: 'negative' },
      { name: 'No follow-up yet', impact: 'negative' },
      { name: 'Competitive bid', impact: 'negative' },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [pricingRecs, setPricingRecs] = useState<PricingRecommendation[]>([]);
  const [winProbs, setWinProbs] = useState<WinProbability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInsights(mockInsights);
      setPricingRecs(mockPricingRecommendations);
      setWinProbs(mockWinProbabilities);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <AIInsightsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-brand-red" />
            AI Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            AI-powered recommendations to improve your business
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
        >
          Refresh Insights
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Target} label="Win Rate" value="68%" change={5.4} color="green" />
        <MetricCard icon={DollarSign} label="Avg. Proposal Value" value="$12,450" change={12.3} color="blue" />
        <MetricCard icon={Clock} label="Avg. Close Time" value="4.2 days" change={-15} color="purple" />
        <MetricCard icon={Users} label="Client Retention" value="87%" change={3.2} color="amber" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Actionable Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Win Probability Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Win Probability
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {winProbs.map((prob) => (
                <WinProbabilityItem key={prob.proposalId} probability={prob} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Pricing Recommendations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingRecs.map((rec) => (
            <PricingRecommendationCard key={rec.serviceId} recommendation={rec} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: number;
  color: 'green' | 'blue' | 'purple' | 'amber';
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5" />
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

function InsightCard({ insight }: { insight: Insight }) {
  const typeConfig = {
    opportunity: {
      icon: Target,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      border: 'border-l-green-500',
    },
    warning: {
      icon: AlertCircle,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      border: 'border-l-amber-500',
    },
    success: {
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      border: 'border-l-blue-500',
    },
    info: {
      icon: Lightbulb,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      border: 'border-l-purple-500',
    },
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card className={cn('border-l-4', config.border)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-2 rounded-lg', config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
              <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                {insight.priority}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{insight.description}</p>
            <div className="flex items-center justify-between">
              {insight.metric && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {insight.metric.value}
                  </span>
                  {insight.metric.change !== undefined && (
                    <span className={cn(
                      'text-sm font-medium',
                      insight.metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {insight.metric.change >= 0 ? '+' : ''}{insight.metric.change}%
                    </span>
                  )}
                </div>
              )}
              {insight.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = insight.action!.href}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  {insight.action.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WinProbabilityItem({ probability }: { probability: WinProbability }) {
  const getColor = (prob: number) => {
    if (prob >= 70) return 'text-green-600 bg-green-500';
    if (prob >= 40) return 'text-amber-600 bg-amber-500';
    return 'text-red-600 bg-red-500';
  };

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{probability.clientName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{probability.proposalNumber}</p>
        </div>
        <div className={cn('text-lg font-bold', getColor(probability.probability).split(' ')[0])}>
          {probability.probability}%
        </div>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full', getColor(probability.probability).split(' ')[1])}
          style={{ width: `${probability.probability}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {probability.factors.slice(0, 3).map((factor, i) => (
          <span
            key={i}
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              factor.impact === 'positive'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {factor.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function PricingRecommendationCard({ recommendation }: { recommendation: PricingRecommendation }) {
  const isIncrease = recommendation.recommendedPrice > recommendation.currentPrice;
  const diff = ((recommendation.recommendedPrice - recommendation.currentPrice) / recommendation.currentPrice) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{recommendation.serviceName}</h3>
        <div className="flex items-center gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${recommendation.currentPrice.toFixed(2)}
            </p>
          </div>
          <ChevronRight className={cn('w-5 h-5', isIncrease ? 'text-green-500' : 'text-red-500')} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Recommended</p>
            <p className={cn('text-lg font-bold', isIncrease ? 'text-green-600' : 'text-red-600')}>
              ${recommendation.recommendedPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{recommendation.reasoning}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Confidence: {recommendation.confidence}%</span>
          <Button variant="outline" size="sm">Apply</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AIInsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
