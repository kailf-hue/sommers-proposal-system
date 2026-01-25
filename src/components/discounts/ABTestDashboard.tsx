/**
 * Sommer's Proposal System - Discount A/B Testing
 * Test different discount strategies to optimize conversions
 */

import { useState, useEffect } from 'react';
import {
  Beaker,
  Play,
  Pause,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Eye,
  Settings,
  Crown,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  trafficAllocation: number; // percentage 0-100
  
  // Results
  impressions: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalDiscount: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  
  // Test configuration
  testType: 'discount_value' | 'discount_type' | 'promo_code' | 'threshold' | 'messaging';
  targetAudience: 'all' | 'new_customers' | 'returning_customers' | 'high_value';
  
  // Variants
  controlVariant: ABTestVariant;
  testVariants: ABTestVariant[];
  
  // Timeline
  startDate: string;
  endDate?: string;
  minSampleSize: number;
  
  // Results
  totalParticipants: number;
  winningVariant?: string;
  statisticalSignificance?: number;
  confidenceLevel: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateABTestInput {
  name: string;
  description: string;
  testType: ABTest['testType'];
  targetAudience: ABTest['targetAudience'];
  controlVariant: Omit<ABTestVariant, 'id' | 'impressions' | 'conversions' | 'conversionRate' | 'totalRevenue' | 'avgOrderValue' | 'totalDiscount'>;
  testVariants: Omit<ABTestVariant, 'id' | 'impressions' | 'conversions' | 'conversionRate' | 'totalRevenue' | 'avgOrderValue' | 'totalDiscount'>[];
  minSampleSize: number;
  confidenceLevel: number;
}

// ============================================================================
// A/B TEST SERVICE
// ============================================================================

export const abTestService = {
  async list(orgId: string): Promise<ABTest[]> {
    const { data, error } = await supabase
      .from('discount_ab_tests')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async get(testId: string): Promise<ABTest | null> {
    const { data, error } = await supabase
      .from('discount_ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(orgId: string, input: CreateABTestInput): Promise<ABTest> {
    const controlVariant: ABTestVariant = {
      ...input.controlVariant,
      id: crypto.randomUUID(),
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      totalDiscount: 0,
    };

    const testVariants: ABTestVariant[] = input.testVariants.map((v) => ({
      ...v,
      id: crypto.randomUUID(),
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      totalDiscount: 0,
    }));

    const { data, error } = await supabase
      .from('discount_ab_tests')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        status: 'draft',
        test_type: input.testType,
        target_audience: input.targetAudience,
        control_variant: controlVariant,
        test_variants: testVariants,
        min_sample_size: input.minSampleSize,
        confidence_level: input.confidenceLevel,
        total_participants: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async start(testId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('discount_ab_tests')
      .update({
        status: 'running',
        start_date: new Date().toISOString(),
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async pause(testId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('discount_ab_tests')
      .update({ status: 'paused' })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async complete(testId: string, winningVariantId: string): Promise<ABTest> {
    const { data, error } = await supabase
      .from('discount_ab_tests')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        winning_variant: winningVariantId,
      })
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(testId: string): Promise<void> {
    const { error } = await supabase
      .from('discount_ab_tests')
      .delete()
      .eq('id', testId);

    if (error) throw error;
  },

  async recordImpression(testId: string, variantId: string): Promise<void> {
    // Record that a user saw this variant
    await supabase.rpc('increment_ab_test_impression', {
      p_test_id: testId,
      p_variant_id: variantId,
    });
  },

  async recordConversion(
    testId: string,
    variantId: string,
    revenue: number,
    discountAmount: number
  ): Promise<void> {
    // Record a conversion for this variant
    await supabase.rpc('record_ab_test_conversion', {
      p_test_id: testId,
      p_variant_id: variantId,
      p_revenue: revenue,
      p_discount: discountAmount,
    });
  },

  // Get which variant to show a user
  async getVariantForUser(
    testId: string,
    userId: string
  ): Promise<ABTestVariant | null> {
    // Check if user already assigned to a variant
    const { data: existing } = await supabase
      .from('ab_test_assignments')
      .select('variant_id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      const test = await this.get(testId);
      if (!test) return null;
      
      const allVariants = [test.controlVariant, ...test.testVariants];
      return allVariants.find((v) => v.id === existing.variant_id) || null;
    }

    // Assign user to a variant based on traffic allocation
    const test = await this.get(testId);
    if (!test || test.status !== 'running') return null;

    const allVariants = [test.controlVariant, ...test.testVariants];
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of allVariants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        // Save assignment
        await supabase.from('ab_test_assignments').insert({
          test_id: testId,
          user_id: userId,
          variant_id: variant.id,
        });
        return variant;
      }
    }

    return test.controlVariant;
  },

  // Calculate statistical significance
  calculateSignificance(control: ABTestVariant, test: ABTestVariant): number {
    // Using a simplified z-test for proportions
    const p1 = control.conversionRate / 100;
    const p2 = test.conversionRate / 100;
    const n1 = control.impressions;
    const n2 = test.impressions;

    if (n1 === 0 || n2 === 0) return 0;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    const z = Math.abs(p2 - p1) / se;

    // Convert z-score to confidence level (simplified)
    if (z >= 2.576) return 99;
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    return Math.min(80, z * 30);
  },
};

// ============================================================================
// A/B TEST DASHBOARD COMPONENT
// ============================================================================

interface ABTestDashboardProps {
  orgId: string;
  className?: string;
}

export function ABTestDashboard({ orgId, className }: ABTestDashboardProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch tests
  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        // Mock data for demo
        const mockTests: ABTest[] = [
          {
            id: '1',
            name: 'Welcome Discount: 10% vs 15%',
            description: 'Testing if higher welcome discount improves conversions',
            status: 'running',
            testType: 'discount_value',
            targetAudience: 'new_customers',
            controlVariant: {
              id: 'ctrl-1',
              name: 'Control (10%)',
              description: 'Current 10% welcome discount',
              discountType: 'percent',
              discountValue: 10,
              trafficAllocation: 50,
              impressions: 1245,
              conversions: 312,
              conversionRate: 25.1,
              totalRevenue: 156000,
              avgOrderValue: 500,
              totalDiscount: 15600,
            },
            testVariants: [
              {
                id: 'var-1',
                name: 'Variant A (15%)',
                description: 'Testing 15% welcome discount',
                discountType: 'percent',
                discountValue: 15,
                trafficAllocation: 50,
                impressions: 1198,
                conversions: 347,
                conversionRate: 29.0,
                totalRevenue: 147350,
                avgOrderValue: 425,
                totalDiscount: 22100,
              },
            ],
            startDate: '2024-01-15T00:00:00Z',
            minSampleSize: 2000,
            totalParticipants: 2443,
            statisticalSignificance: 92,
            confidenceLevel: 95,
            createdAt: '2024-01-10T00:00:00Z',
            updatedAt: '2024-01-20T00:00:00Z',
          },
          {
            id: '2',
            name: 'Fixed vs Percentage Discount',
            description: 'Testing $50 off vs 10% off for orders over $400',
            status: 'completed',
            testType: 'discount_type',
            targetAudience: 'all',
            controlVariant: {
              id: 'ctrl-2',
              name: 'Control (10%)',
              description: '10% off orders over $400',
              discountType: 'percent',
              discountValue: 10,
              trafficAllocation: 50,
              impressions: 3456,
              conversions: 892,
              conversionRate: 25.8,
              totalRevenue: 534000,
              avgOrderValue: 599,
              totalDiscount: 53400,
            },
            testVariants: [
              {
                id: 'var-2',
                name: 'Variant A ($50 off)',
                description: '$50 off orders over $400',
                discountType: 'fixed',
                discountValue: 50,
                trafficAllocation: 50,
                impressions: 3521,
                conversions: 1023,
                conversionRate: 29.1,
                totalRevenue: 562650,
                avgOrderValue: 550,
                totalDiscount: 51150,
              },
            ],
            startDate: '2023-11-01T00:00:00Z',
            endDate: '2023-12-15T00:00:00Z',
            minSampleSize: 5000,
            totalParticipants: 6977,
            winningVariant: 'var-2',
            statisticalSignificance: 98,
            confidenceLevel: 95,
            createdAt: '2023-10-25T00:00:00Z',
            updatedAt: '2023-12-15T00:00:00Z',
          },
          {
            id: '3',
            name: 'Loyalty Tier Thresholds',
            description: 'Testing lower thresholds for Silver tier',
            status: 'draft',
            testType: 'threshold',
            targetAudience: 'returning_customers',
            controlVariant: {
              id: 'ctrl-3',
              name: 'Control (1000 pts)',
              description: 'Current Silver threshold at 1000 points',
              discountType: 'percent',
              discountValue: 5,
              trafficAllocation: 50,
              impressions: 0,
              conversions: 0,
              conversionRate: 0,
              totalRevenue: 0,
              avgOrderValue: 0,
              totalDiscount: 0,
            },
            testVariants: [
              {
                id: 'var-3',
                name: 'Variant A (750 pts)',
                description: 'Lower Silver threshold to 750 points',
                discountType: 'percent',
                discountValue: 5,
                trafficAllocation: 50,
                impressions: 0,
                conversions: 0,
                conversionRate: 0,
                totalRevenue: 0,
                avgOrderValue: 0,
                totalDiscount: 0,
              },
            ],
            startDate: '',
            minSampleSize: 1000,
            totalParticipants: 0,
            confidenceLevel: 95,
            createdAt: '2024-01-18T00:00:00Z',
            updatedAt: '2024-01-18T00:00:00Z',
          },
        ];
        setTests(mockTests);
      } catch (error) {
        console.error('Failed to fetch A/B tests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [orgId]);

  // Status badge
  const StatusBadge = ({ status }: { status: ABTest['status'] }) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-600',
      running: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    const icons = {
      draft: <Clock className="w-3 h-3" />,
      running: <Play className="w-3 h-3" />,
      paused: <Pause className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
    };
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1', styles[status])}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Beaker className="w-6 h-6 text-purple-500" />
            A/B Testing
          </h2>
          <p className="text-gray-500">Test discount strategies to optimize conversions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>

      {/* Active Tests Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Play className="w-4 h-4 text-green-500" />
            Running
          </div>
          <div className="text-2xl font-bold">{tests.filter((t) => t.status === 'running').length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            Total Participants
          </div>
          <div className="text-2xl font-bold">
            {tests.reduce((sum, t) => sum + t.totalParticipants, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            Completed
          </div>
          <div className="text-2xl font-bold">{tests.filter((t) => t.status === 'completed').length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Avg Lift
          </div>
          <div className="text-2xl font-bold text-green-600">+12.4%</div>
        </div>
      </div>

      {/* Tests List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-700">
          <h3 className="font-semibold">All Tests</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{test.name}</h4>
                    <StatusBadge status={test.status} />
                    {test.winningVariant && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Winner Found
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{test.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="capitalize">{test.testType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{test.targetAudience.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{test.totalParticipants.toLocaleString()} participants</span>
                    {test.statisticalSignificance && (
                      <>
                        <span>•</span>
                        <span className={test.statisticalSignificance >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                          {test.statisticalSignificance}% significance
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                {test.status !== 'draft' && (
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className="text-sm font-medium">
                        {test.controlVariant.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Control</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-600">
                        {test.testVariants[0]?.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Variant A</div>
                    </div>
                    <div>
                      <div
                        className={cn(
                          'text-sm font-medium',
                          test.testVariants[0]?.conversionRate > test.controlVariant.conversionRate
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {test.testVariants[0]?.conversionRate > test.controlVariant.conversionRate ? '+' : ''}
                        {(test.testVariants[0]?.conversionRate - test.controlVariant.conversionRate).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Lift</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Comparison (expanded for running tests) */}
              {test.status === 'running' && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {/* Control */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{test.controlVariant.name}</span>
                      <span className="text-xs text-gray-500">{test.controlVariant.trafficAllocation}% traffic</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold">{test.controlVariant.impressions.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{test.controlVariant.conversions.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Conversions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{test.controlVariant.conversionRate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Variant A */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {test.testVariants[0]?.name}
                      </span>
                      <span className="text-xs text-purple-600">{test.testVariants[0]?.trafficAllocation}% traffic</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {test.testVariants[0]?.impressions.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600">Views</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {test.testVariants[0]?.conversions.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600">Conversions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {test.testVariants[0]?.conversionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-purple-600">Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress to significance */}
              {test.status === 'running' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to min sample size</span>
                    <span>{test.totalParticipants} / {test.minSampleSize}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${Math.min(100, (test.totalParticipants / test.minSampleSize) * 100)}%` }}
                    />
                  </div>
                  {test.statisticalSignificance && test.statisticalSignificance >= test.confidenceLevel && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Statistical significance reached! Consider concluding the test.
                    </div>
                  )}
                </div>
              )}

              {/* Completed Test Results */}
              {test.status === 'completed' && test.winningVariant && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-2">
                    <Crown className="w-5 h-5" />
                    Winner: {test.testVariants.find((v) => v.id === test.winningVariant)?.name || test.controlVariant.name}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Conversion Lift:</span>
                      <span className="ml-2 font-bold text-green-600">
                        +{(test.testVariants[0]?.conversionRate - test.controlVariant.conversionRate).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Additional Revenue:</span>
                      <span className="ml-2 font-bold">
                        ${((test.testVariants[0]?.totalRevenue || 0) - test.controlVariant.totalRevenue).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Statistical Significance:</span>
                      <span className="ml-2 font-bold text-green-600">{test.statisticalSignificance}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
          <Beaker className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No A/B Tests Yet</h3>
          <p className="text-gray-500 mb-4">Start testing discount strategies to optimize your conversions</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create Your First Test
          </button>
        </div>
      )}

      {/* Best Practices */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          A/B Testing Best Practices
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-700 dark:text-purple-300">
          <div>
            <h4 className="font-medium mb-1">Test One Variable at a Time</h4>
            <p className="opacity-80">Change only the discount value OR type, not both simultaneously.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Wait for Statistical Significance</h4>
            <p className="opacity-80">Don't conclude tests early. Wait for 95%+ confidence.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Use Adequate Sample Size</h4>
            <p className="opacity-80">Aim for at least 1,000 participants per variant for reliable results.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Implement Winners Permanently</h4>
            <p className="opacity-80">After a test concludes, apply the winning strategy across all users.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ABTestDashboard;
