/**
 * Sommer's Proposal System - AI Pricing Optimization Page
 * Phase 48-49: ML-based pricing recommendations and win prediction
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  PieChart as PieChartIcon,
  Calculator,
  Lightbulb,
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Label,
} from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ComposedChart,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface PricingRecommendation {
  serviceType: string;
  currentPrice: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  winProbability: number;
  factors: PricingFactor[];
  recommendation: 'increase' | 'decrease' | 'maintain';
  reasoning: string;
}

interface PricingFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

interface OptimizationTradeoff {
  price: number;
  winProbability: number;
  expectedValue: number;
}

interface DealScoring {
  proposalId: string;
  overallScore: number;
  dimensions: {
    clientFit: number;
    dealSize: number;
    timing: number;
    competition: number;
    relationship: number;
  };
  recommendations: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRecommendation: PricingRecommendation = {
  serviceType: 'Sealcoating',
  currentPrice: 4500,
  recommendedPrice: 4850,
  priceRange: { min: 4000, max: 5500 },
  confidence: 82,
  winProbability: 68,
  factors: [
    { name: 'Surface Condition', impact: 12, direction: 'positive', description: 'Fair condition requires additional prep work', weight: 0.25 },
    { name: 'Seasonal Demand', impact: 8, direction: 'positive', description: 'High season allows premium pricing', weight: 0.20 },
    { name: 'Client Relationship', impact: -5, direction: 'negative', description: 'Repeat customer loyalty discount', weight: 0.15 },
    { name: 'Project Size', impact: -3, direction: 'negative', description: 'Large project volume discount', weight: 0.15 },
    { name: 'Market Position', impact: 6, direction: 'positive', description: 'Strong win rate supports higher prices', weight: 0.25 },
  ],
  recommendation: 'increase',
  reasoning: 'Based on analysis of 5 pricing factors, we recommend increasing the price by 7.8%. Current market conditions and your strong win rate support this adjustment.',
};

const mockTradeoffs: OptimizationTradeoff[] = [
  { price: 4000, winProbability: 85, expectedValue: 3400 },
  { price: 4250, winProbability: 78, expectedValue: 3315 },
  { price: 4500, winProbability: 72, expectedValue: 3240 },
  { price: 4750, winProbability: 65, expectedValue: 3088 },
  { price: 4850, winProbability: 68, expectedValue: 3298 },
  { price: 5000, winProbability: 55, expectedValue: 2750 },
  { price: 5250, winProbability: 45, expectedValue: 2363 },
  { price: 5500, winProbability: 35, expectedValue: 1925 },
];

const mockDealScoring: DealScoring = {
  proposalId: 'SOM-2026-0156',
  overallScore: 72,
  dimensions: {
    clientFit: 85,
    dealSize: 65,
    timing: 70,
    competition: 68,
    relationship: 75,
  },
  recommendations: [
    'Follow up within 2 days to maintain momentum',
    'Consider offering a 5% discount to close faster',
    'Schedule a call to address any concerns',
  ],
};

const mockMarketData = [
  { month: 'Sep', yourPrice: 4200, marketAvg: 4500, winRate: 45 },
  { month: 'Oct', yourPrice: 4400, marketAvg: 4600, winRate: 48 },
  { month: 'Nov', yourPrice: 4300, marketAvg: 4400, winRate: 52 },
  { month: 'Dec', yourPrice: 3800, marketAvg: 4000, winRate: 55 },
  { month: 'Jan', yourPrice: 4500, marketAvg: 4700, winRate: 42 },
  { month: 'Feb', yourPrice: 4600, marketAvg: 4800, winRate: 40 },
];

const mockSeasonalPricing = [
  { month: 'Jan', index: 85, suggested: 4250 },
  { month: 'Feb', index: 90, suggested: 4500 },
  { month: 'Mar', index: 100, suggested: 5000 },
  { month: 'Apr', index: 115, suggested: 5750 },
  { month: 'May', index: 125, suggested: 6250 },
  { month: 'Jun', index: 130, suggested: 6500 },
  { month: 'Jul', index: 130, suggested: 6500 },
  { month: 'Aug', index: 125, suggested: 6250 },
  { month: 'Sep', index: 115, suggested: 5750 },
  { month: 'Oct', index: 100, suggested: 5000 },
  { month: 'Nov', index: 90, suggested: 4500 },
  { month: 'Dec', index: 80, suggested: 4000 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AIPricing() {
  const { organization } = useAuth();
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [dealScoring, setDealScoring] = useState<DealScoring | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculator inputs
  const [serviceType, setServiceType] = useState('sealcoating');
  const [squareFootage, setSquareFootage] = useState(5000);
  const [condition, setCondition] = useState('fair');

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecommendation(mockRecommendation);
      setDealScoring(mockDealScoring);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCalculate = async () => {
    setIsCalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCalculating(false);
  };

  if (isLoading) {
    return <PricingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-brand-red" />
            AI Pricing Optimization
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Machine learning-powered pricing recommendations
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 gap-1">
          <Sparkles className="w-3 h-3" />
          AI Powered
        </Badge>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="w-4 h-4" />
            Price Calculator
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <Sliders className="w-4 h-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Target className="w-4 h-4" />
            Deal Scoring
          </TabsTrigger>
        </TabsList>

        {/* Price Calculator */}
        <TabsContent value="calculator" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-red" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sealcoating">Sealcoating</SelectItem>
                      <SelectItem value="crack_filling">Crack Filling</SelectItem>
                      <SelectItem value="line_striping">Line Striping</SelectItem>
                      <SelectItem value="patching">Patching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Square Footage: {squareFootage.toLocaleString()} sq ft</Label>
                  <Slider
                    value={[squareFootage]}
                    onValueChange={([v]) => setSquareFootage(v)}
                    min={500}
                    max={50000}
                    step={500}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Surface Condition</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good - Minimal prep</SelectItem>
                      <SelectItem value="fair">Fair - Some prep needed</SelectItem>
                      <SelectItem value="poor">Poor - Extensive prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full"
                  leftIcon={isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                >
                  {isCalculating ? 'Analyzing...' : 'Calculate Price'}
                </Button>
              </CardContent>
            </Card>

            {/* Recommendation Panel */}
            {recommendation && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>AI Recommendation</CardTitle>
                    <Badge className={cn(
                      recommendation.recommendation === 'increase' ? 'bg-green-100 text-green-700' :
                      recommendation.recommendation === 'decrease' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {recommendation.recommendation === 'increase' ? <TrendingUp className="w-3 h-3 mr-1" /> : 
                       recommendation.recommendation === 'decrease' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                      {recommendation.recommendation.charAt(0).toUpperCase() + recommendation.recommendation.slice(1)} Price
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(recommendation.currentPrice)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-brand-red/10">
                      <p className="text-sm text-brand-red">Recommended</p>
                      <p className="text-3xl font-bold text-brand-red">
                        {formatCurrency(recommendation.recommendedPrice)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm text-gray-500">Win Probability</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {recommendation.winProbability}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Progress value={recommendation.confidence} className="flex-1 h-2" />
                    <span className="text-sm text-gray-500">{recommendation.confidence}% confidence</span>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 mb-6">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">{recommendation.reasoning}</p>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pricing Factors</h4>
                  <div className="space-y-3">
                    {recommendation.factors.map((factor) => (
                      <FactorBar key={factor.name} factor={factor} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Price Optimization */}
        <TabsContent value="optimization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Price vs Win Probability</CardTitle>
                <CardDescription>Find the optimal price point</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockTradeoffs}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="price" tickFormatter={(v) => `$${v / 1000}K`} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: number, name) => [
                        name === 'winProbability' ? `${v}%` : formatCurrency(v),
                        name === 'winProbability' ? 'Win Rate' : 'Expected Value'
                      ]} />
                      <Area yAxisId="left" type="monotone" dataKey="winProbability" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Win Rate" />
                      <Line yAxisId="right" type="monotone" dataKey="expectedValue" stroke="#C41E3A" strokeWidth={2} name="Expected Value" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-200">Optimal Price</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">$4,850</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Maximum expected value at 68% win rate
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm text-gray-500">Expected Revenue</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">$3,298</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm text-gray-500">vs. Current</p>
                      <p className="text-xl font-bold text-green-600">+$58</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Trade-off Alert</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Pricing above $5,000 drops win rate below 55%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Analysis */}
        <TabsContent value="market" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Pricing vs Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockMarketData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}K`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="yourPrice" stroke="#C41E3A" strokeWidth={2} name="Your Price" />
                      <Line type="monotone" dataKey="marketAvg" stroke="#6B7280" strokeDasharray="5 5" name="Market Avg" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Pricing Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockSeasonalPricing}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}K`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="suggested" radius={[4, 4, 0, 0]}>
                        {mockSeasonalPricing.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.index >= 120 ? '#22C55E' : entry.index >= 100 ? '#3B82F6' : '#F59E0B'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deal Scoring */}
        <TabsContent value="scoring" className="mt-6">
          {dealScoring && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Score: {dealScoring.proposalId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className={cn(
                      'inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold',
                      dealScoring.overallScore >= 70 ? 'bg-green-100 text-green-700' :
                      dealScoring.overallScore >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {dealScoring.overallScore}
                    </div>
                    <p className="text-gray-500 mt-2">Overall Score</p>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={Object.entries(dealScoring.dimensions).map(([key, value]) => ({
                        dimension: key.replace(/([A-Z])/g, ' $1').trim(),
                        score: value,
                        fullMark: 100,
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimension" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Score" dataKey="score" stroke="#C41E3A" fill="#C41E3A" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dealScoring.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-brand-red">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {Object.entries(dealScoring.dimensions).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg border dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={cn(
                            'text-sm font-semibold',
                            value >= 70 ? 'text-green-600' : value >= 50 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {value}
                          </span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FactorBar({ factor }: { factor: PricingFactor }) {
  const isPositive = factor.direction === 'positive';
  const isNegative = factor.direction === 'negative';

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-600 dark:text-gray-400">{factor.name}</div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-400'
            )}
            style={{ width: `${Math.min(100, Math.abs(factor.impact) * 3)}%` }}
          />
        </div>
        <span className={cn(
          'text-sm font-medium w-12 text-right',
          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
        )}>
          {isPositive ? '+' : ''}{factor.impact}%
        </span>
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96 col-span-2" />
      </div>
    </div>
  );
}
