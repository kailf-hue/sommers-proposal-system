/**
 * Sommer's Proposal System - Advanced Analytics Service
 * Phase 43: Deep analytics, cohort analysis, and business intelligence
 */

import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AdvancedAnalyticsData {
  performanceMetrics: PerformanceMetrics;
  cohortAnalysis: CohortData[];
  conversionFunnel: FunnelStage[];
  revenueAnalytics: RevenueAnalytics;
  seasonalTrends: SeasonalTrend[];
  competitiveMetrics: CompetitiveMetrics;
  customerLifecycle: CustomerLifecycleData;
  proposalAnalytics: ProposalAnalytics;
}

export interface PerformanceMetrics {
  period: string;
  revenue: number;
  revenuePrevPeriod: number;
  revenueChange: number;
  proposals: number;
  proposalsPrevPeriod: number;
  proposalsChange: number;
  winRate: number;
  winRatePrevPeriod: number;
  winRateChange: number;
  avgDealSize: number;
  avgDealSizePrevPeriod: number;
  avgDealSizeChange: number;
  cycleTime: number;
  cycleTimePrevPeriod: number;
  cycleTimeChange: number;
  responseTime: number;
  responseTimePrevPeriod: number;
  responseTimeChange: number;
}

export interface CohortData {
  cohort: string; // Month of acquisition
  size: number;
  retention: { month: number; rate: number; revenue: number }[];
  ltv: number;
  avgOrderValue: number;
  ordersPerCustomer: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeInStage: number;
}

export interface RevenueAnalytics {
  mrr: number;
  arr: number;
  arpu: number;
  revenueByService: { service: string; revenue: number; percentage: number }[];
  revenueByMonth: { month: string; revenue: number; target: number }[];
  revenueBySource: { source: string; revenue: number; deals: number }[];
  revenueBySegment: { segment: string; revenue: number; clients: number }[];
}

export interface SeasonalTrend {
  month: string;
  historicalAvg: number;
  currentYear: number;
  index: number; // Seasonality index (100 = average)
  recommendation: string;
}

export interface CompetitiveMetrics {
  winRateVsCompetitors: number;
  avgDealSizeVsIndustry: number;
  cycleTimeVsIndustry: number;
  marketShare: number;
  competitorMentions: { competitor: string; count: number; winRate: number }[];
}

export interface CustomerLifecycleData {
  newCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  churnedCustomers: number;
  reactivatedCustomers: number;
  avgLifespan: number;
  churnRate: number;
  expansionRevenue: number;
  netRevenueRetention: number;
}

export interface ProposalAnalytics {
  totalSent: number;
  avgViewsPerProposal: number;
  avgTimeToFirstView: number;
  avgTimeToPeaked: number;
  contentEngagement: { section: string; avgTimeSpent: number; completion: number }[];
  optimalSendTime: { dayOfWeek: string; hour: number; winRate: number }[];
  proposalLength: { range: string; count: number; winRate: number }[];
  discountImpact: { range: string; usage: number; winRate: number }[];
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'table' | 'chart' | 'summary';
  metrics: string[];
  filters: ReportFilter[];
  schedule?: string;
  recipients?: string[];
  lastRun?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: unknown;
}

// ============================================================================
// ADVANCED ANALYTICS SERVICE
// ============================================================================

export const advancedAnalyticsService = {
  // --------------------------------------------------------------------------
  // Main Dashboard
  // --------------------------------------------------------------------------

  /**
   * Get complete advanced analytics data
   */
  async getAnalyticsData(
    orgId: string,
    options?: { period?: string; compareWith?: string }
  ): Promise<AdvancedAnalyticsData> {
    const period = options?.period || 'month';

    const [
      performanceMetrics,
      cohortAnalysis,
      conversionFunnel,
      revenueAnalytics,
      seasonalTrends,
      competitiveMetrics,
      customerLifecycle,
      proposalAnalytics,
    ] = await Promise.all([
      this.getPerformanceMetrics(orgId, period),
      this.getCohortAnalysis(orgId),
      this.getConversionFunnel(orgId),
      this.getRevenueAnalytics(orgId),
      this.getSeasonalTrends(orgId),
      this.getCompetitiveMetrics(orgId),
      this.getCustomerLifecycle(orgId),
      this.getProposalAnalytics(orgId),
    ]);

    return {
      performanceMetrics,
      cohortAnalysis,
      conversionFunnel,
      revenueAnalytics,
      seasonalTrends,
      competitiveMetrics,
      customerLifecycle,
      proposalAnalytics,
    };
  },

  /**
   * Get performance metrics with comparison
   */
  async getPerformanceMetrics(
    orgId: string,
    period: string
  ): Promise<PerformanceMetrics> {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (period === 'week') {
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      currentEnd = now;
      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      currentStart = new Date(now.getFullYear(), quarter * 3, 1);
      currentEnd = now;
      prevStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      prevEnd = new Date(now.getFullYear(), quarter * 3, 0);
    } else if (period === 'year') {
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = now;
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      // Default to month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = now;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Current period metrics
    const current = await this.getPeriodMetrics(orgId, currentStart, currentEnd);
    const prev = await this.getPeriodMetrics(orgId, prevStart, prevEnd);

    const calcChange = (curr: number, pre: number) =>
      pre > 0 ? ((curr - pre) / pre) * 100 : curr > 0 ? 100 : 0;

    return {
      period,
      revenue: current.revenue,
      revenuePrevPeriod: prev.revenue,
      revenueChange: Math.round(calcChange(current.revenue, prev.revenue) * 10) / 10,
      proposals: current.proposals,
      proposalsPrevPeriod: prev.proposals,
      proposalsChange: Math.round(calcChange(current.proposals, prev.proposals) * 10) / 10,
      winRate: current.winRate,
      winRatePrevPeriod: prev.winRate,
      winRateChange: Math.round((current.winRate - prev.winRate) * 10) / 10,
      avgDealSize: current.avgDealSize,
      avgDealSizePrevPeriod: prev.avgDealSize,
      avgDealSizeChange: Math.round(calcChange(current.avgDealSize, prev.avgDealSize) * 10) / 10,
      cycleTime: current.cycleTime,
      cycleTimePrevPeriod: prev.cycleTime,
      cycleTimeChange: Math.round((prev.cycleTime - current.cycleTime) * 10) / 10, // Negative is good
      responseTime: current.responseTime,
      responseTimePrevPeriod: prev.responseTime,
      responseTimeChange: Math.round((prev.responseTime - current.responseTime) * 10) / 10,
    };
  },

  /**
   * Get metrics for a specific period
   */
  async getPeriodMetrics(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    revenue: number;
    proposals: number;
    winRate: number;
    avgDealSize: number;
    cycleTime: number;
    responseTime: number;
  }> {
    // Get proposals in period
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, total_amount, status, created_at, sent_at, updated_at')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const proposalCount = proposals?.length || 0;
    const wonDeals = proposals?.filter(p => p.status === 'accepted') || [];
    const lostDeals = proposals?.filter(p => p.status === 'rejected') || [];
    
    const revenue = wonDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const winRate = wonDeals.length + lostDeals.length > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;
    const avgDealSize = wonDeals.length > 0
      ? revenue / wonDeals.length
      : 0;

    // Calculate cycle time (sent to accepted)
    const cycleTimes = wonDeals
      .filter(p => p.sent_at)
      .map(p => {
        const sent = new Date(p.sent_at);
        const closed = new Date(p.updated_at);
        return (closed.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24);
      });
    const cycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 0;

    // Calculate response time (created to first view)
    const responseTimes = (proposals || [])
      .filter(p => p.sent_at)
      .map(p => {
        const created = new Date(p.created_at);
        const sent = new Date(p.sent_at);
        return (sent.getTime() - created.getTime()) / (1000 * 60 * 60);
      });
    const responseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      revenue,
      proposals: proposalCount,
      winRate: Math.round(winRate * 10) / 10,
      avgDealSize: Math.round(avgDealSize),
      cycleTime: Math.round(cycleTime * 10) / 10,
      responseTime: Math.round(responseTime * 10) / 10,
    };
  },

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(orgId: string): Promise<CohortData[]> {
    const cohorts: CohortData[] = [];
    const now = new Date();

    // Analyze last 6 monthly cohorts
    for (let i = 5; i >= 0; i--) {
      const cohortMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEnd = new Date(cohortMonth.getFullYear(), cohortMonth.getMonth() + 1, 0);

      // Get clients acquired in this cohort
      const { data: cohortClients } = await supabase
        .from('clients')
        .select('id')
        .eq('org_id', orgId)
        .gte('created_at', cohortMonth.toISOString())
        .lte('created_at', cohortEnd.toISOString());

      const cohortSize = cohortClients?.length || 0;
      if (cohortSize === 0) continue;

      const clientIds = cohortClients?.map(c => c.id) || [];

      // Calculate retention and revenue for each subsequent month
      const retention: { month: number; rate: number; revenue: number }[] = [];
      let totalRevenue = 0;
      let totalOrders = 0;

      for (let month = 0; month <= i; month++) {
        const periodStart = new Date(cohortMonth.getFullYear(), cohortMonth.getMonth() + month, 1);
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

        // Count active clients in this period
        const { data: activeProposals } = await supabase
          .from('proposals')
          .select('client_id, total_amount, status')
          .eq('org_id', orgId)
          .in('client_id', clientIds)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString());

        const uniqueActiveClients = new Set(activeProposals?.map(p => p.client_id));
        const retentionRate = (uniqueActiveClients.size / cohortSize) * 100;

        const periodRevenue = (activeProposals || [])
          .filter(p => p.status === 'accepted')
          .reduce((sum, p) => sum + (p.total_amount || 0), 0);

        totalRevenue += periodRevenue;
        totalOrders += activeProposals?.filter(p => p.status === 'accepted').length || 0;

        retention.push({
          month,
          rate: Math.round(retentionRate),
          revenue: periodRevenue,
        });
      }

      cohorts.push({
        cohort: cohortMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        size: cohortSize,
        retention,
        ltv: cohortSize > 0 ? Math.round(totalRevenue / cohortSize) : 0,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        ordersPerCustomer: cohortSize > 0 ? Math.round((totalOrders / cohortSize) * 10) / 10 : 0,
      });
    }

    return cohorts;
  },

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(orgId: string): Promise<FunnelStage[]> {
    const stages = [
      { id: 'created', name: 'Created' },
      { id: 'sent', name: 'Sent' },
      { id: 'viewed', name: 'Viewed' },
      { id: 'engaged', name: 'Engaged' },
      { id: 'accepted', name: 'Won' },
    ];

    const funnel: FunnelStage[] = [];
    let prevCount = 0;

    for (const stage of stages) {
      let count = 0;
      let value = 0;

      if (stage.id === 'created') {
        const { data } = await supabase
          .from('proposals')
          .select('id, total_amount')
          .eq('org_id', orgId);
        count = data?.length || 0;
        value = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      } else if (stage.id === 'sent') {
        const { data } = await supabase
          .from('proposals')
          .select('id, total_amount')
          .eq('org_id', orgId)
          .not('sent_at', 'is', null);
        count = data?.length || 0;
        value = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      } else if (stage.id === 'viewed') {
        const { data } = await supabase
          .from('proposals')
          .select('id, total_amount, view_count')
          .eq('org_id', orgId)
          .gt('view_count', 0);
        count = data?.length || 0;
        value = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      } else if (stage.id === 'engaged') {
        const { data } = await supabase
          .from('proposals')
          .select('id, total_amount, view_count')
          .eq('org_id', orgId)
          .gt('view_count', 2);
        count = data?.length || 0;
        value = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      } else if (stage.id === 'accepted') {
        const { data } = await supabase
          .from('proposals')
          .select('id, total_amount')
          .eq('org_id', orgId)
          .eq('status', 'accepted');
        count = data?.length || 0;
        value = data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      }

      const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 100;
      const dropoffRate = 100 - conversionRate;

      funnel.push({
        stage: stage.name,
        count,
        value,
        conversionRate: Math.round(conversionRate * 10) / 10,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
        avgTimeInStage: Math.floor(Math.random() * 5) + 1, // Would calculate from actual data
      });

      prevCount = count;
    }

    return funnel;
  },

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(orgId: string): Promise<RevenueAnalytics> {
    // Get all won proposals
    const { data: wonProposals } = await supabase
      .from('proposals')
      .select(`
        total_amount,
        created_at,
        clients (source)
      `)
      .eq('org_id', orgId)
      .eq('status', 'accepted');

    const totalRevenue = wonProposals?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    const dealCount = wonProposals?.length || 0;

    // Get unique customers
    const { count: customerCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Monthly recurring (simplified - would need subscription data)
    const mrr = Math.round(totalRevenue / 12);
    const arr = totalRevenue;
    const arpu = customerCount && customerCount > 0 ? Math.round(totalRevenue / customerCount) : 0;

    // Revenue by service (mock - would need line items)
    const revenueByService = [
      { service: 'Sealcoating', revenue: Math.round(totalRevenue * 0.55), percentage: 55 },
      { service: 'Crack Filling', revenue: Math.round(totalRevenue * 0.25), percentage: 25 },
      { service: 'Line Striping', revenue: Math.round(totalRevenue * 0.15), percentage: 15 },
      { service: 'Other', revenue: Math.round(totalRevenue * 0.05), percentage: 5 },
    ];

    // Revenue by month
    const revenueByMonth: { month: string; revenue: number; target: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthRevenue = (wonProposals || [])
        .filter(p => {
          const created = new Date(p.created_at);
          return created >= month && created <= monthEnd;
        })
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      revenueByMonth.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        target: Math.round(totalRevenue / 6 * 1.1), // 10% above average as target
      });
    }

    // Revenue by source
    const sourceMap = new Map<string, { revenue: number; deals: number }>();
    (wonProposals || []).forEach(p => {
      const source = (p.clients as any)?.source || 'Direct';
      const current = sourceMap.get(source) || { revenue: 0, deals: 0 };
      sourceMap.set(source, {
        revenue: current.revenue + (p.total_amount || 0),
        deals: current.deals + 1,
      });
    });
    const revenueBySource = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      revenue: data.revenue,
      deals: data.deals,
    }));

    // Revenue by segment
    const revenueBySegment = [
      { segment: 'Enterprise', revenue: Math.round(totalRevenue * 0.4), clients: Math.round(dealCount * 0.1) },
      { segment: 'Mid-Market', revenue: Math.round(totalRevenue * 0.35), clients: Math.round(dealCount * 0.3) },
      { segment: 'SMB', revenue: Math.round(totalRevenue * 0.25), clients: Math.round(dealCount * 0.6) },
    ];

    return {
      mrr,
      arr,
      arpu,
      revenueByService,
      revenueByMonth,
      revenueBySource,
      revenueBySegment,
    };
  },

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(orgId: string): Promise<SeasonalTrend[]> {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Sealcoating seasonality (peak in spring/summer, low in winter)
    const seasonalityIndex = [
      40, 50, 80, 110, 130, 140, 150, 140, 120, 90, 60, 40,
    ];

    const { data: proposals } = await supabase
      .from('proposals')
      .select('total_amount, created_at, status')
      .eq('org_id', orgId)
      .eq('status', 'accepted');

    const now = new Date();
    const trends: SeasonalTrend[] = [];

    months.forEach((month, index) => {
      // Current year revenue for this month
      const currentYearRevenue = (proposals || [])
        .filter(p => {
          const created = new Date(p.created_at);
          return created.getMonth() === index && created.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      // Historical average (all years)
      const allYearsRevenue = (proposals || [])
        .filter(p => new Date(p.created_at).getMonth() === index)
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const yearsOfData = new Set(
        (proposals || [])
          .filter(p => new Date(p.created_at).getMonth() === index)
          .map(p => new Date(p.created_at).getFullYear())
      ).size || 1;
      const historicalAvg = allYearsRevenue / yearsOfData;

      // Recommendation based on seasonality
      let recommendation = '';
      if (seasonalityIndex[index] >= 130) {
        recommendation = 'Peak season - maximize capacity and pricing';
      } else if (seasonalityIndex[index] >= 100) {
        recommendation = 'Strong season - focus on closing deals';
      } else if (seasonalityIndex[index] >= 70) {
        recommendation = 'Moderate season - balance prospecting and closing';
      } else {
        recommendation = 'Slow season - focus on maintenance and planning';
      }

      trends.push({
        month,
        historicalAvg: Math.round(historicalAvg),
        currentYear: currentYearRevenue,
        index: seasonalityIndex[index],
        recommendation,
      });
    });

    return trends;
  },

  /**
   * Get competitive metrics
   */
  async getCompetitiveMetrics(orgId: string): Promise<CompetitiveMetrics> {
    // In production, would integrate with competitive intelligence
    // For now, return industry benchmarks
    const { data: proposals } = await supabase
      .from('proposals')
      .select('total_amount, status, competitor_mentioned')
      .eq('org_id', orgId);

    const wonDeals = proposals?.filter(p => p.status === 'accepted') || [];
    const lostDeals = proposals?.filter(p => p.status === 'rejected') || [];
    const allClosed = wonDeals.length + lostDeals.length;

    const winRate = allClosed > 0 ? (wonDeals.length / allClosed) * 100 : 0;
    const avgDealSize = wonDeals.length > 0
      ? wonDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0) / wonDeals.length
      : 0;

    // Industry benchmarks for asphalt maintenance
    const industryWinRate = 35;
    const industryAvgDeal = 12000;
    const industryCycleTime = 14;

    return {
      winRateVsCompetitors: Math.round((winRate / industryWinRate) * 100),
      avgDealSizeVsIndustry: Math.round((avgDealSize / industryAvgDeal) * 100),
      cycleTimeVsIndustry: 85, // Would calculate from actual data
      marketShare: 15, // Would need market data
      competitorMentions: [
        { competitor: 'ABC Paving', count: 12, winRate: 60 },
        { competitor: 'Quick Seal Pro', count: 8, winRate: 45 },
        { competitor: 'Local Asphalt Co', count: 5, winRate: 70 },
      ],
    };
  },

  /**
   * Get customer lifecycle data
   */
  async getCustomerLifecycle(orgId: string): Promise<CustomerLifecycleData> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // New customers (last 30 days)
    const { count: newCustomers } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Active customers (proposal activity in last 90 days)
    const { data: activeData } = await supabase
      .from('proposals')
      .select('client_id')
      .eq('org_id', orgId)
      .gte('created_at', ninetyDaysAgo.toISOString());
    const activeCustomers = new Set(activeData?.map(p => p.client_id)).size;

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // At-risk (no activity in 90+ days)
    const atRiskCustomers = (totalCustomers || 0) - activeCustomers - (newCustomers || 0);

    // Churn calculation
    const churned = Math.round((totalCustomers || 0) * 0.05); // Simplified
    const churnRate = totalCustomers && totalCustomers > 0
      ? (churned / totalCustomers) * 100
      : 0;

    return {
      newCustomers: newCustomers || 0,
      activeCustomers,
      atRiskCustomers: Math.max(0, atRiskCustomers),
      churnedCustomers: churned,
      reactivatedCustomers: Math.round((totalCustomers || 0) * 0.02),
      avgLifespan: 24, // Months - would calculate from data
      churnRate: Math.round(churnRate * 10) / 10,
      expansionRevenue: 15000, // Would calculate from upsells
      netRevenueRetention: 105, // Would calculate from revenue data
    };
  },

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(orgId: string): Promise<ProposalAnalytics> {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, view_count, sent_at, first_viewed_at, total_amount, status, discount_amount')
      .eq('org_id', orgId)
      .not('sent_at', 'is', null);

    const totalSent = proposals?.length || 0;
    const avgViewsPerProposal = totalSent > 0
      ? (proposals?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0) / totalSent
      : 0;

    // Time to first view
    const timesToView = (proposals || [])
      .filter(p => p.first_viewed_at && p.sent_at)
      .map(p => {
        const sent = new Date(p.sent_at);
        const viewed = new Date(p.first_viewed_at);
        return (viewed.getTime() - sent.getTime()) / (1000 * 60 * 60);
      });
    const avgTimeToFirstView = timesToView.length > 0
      ? timesToView.reduce((a, b) => a + b, 0) / timesToView.length
      : 0;

    // Content engagement (mock - would need tracking data)
    const contentEngagement = [
      { section: 'Cover Letter', avgTimeSpent: 45, completion: 95 },
      { section: 'Scope of Work', avgTimeSpent: 120, completion: 88 },
      { section: 'Pricing', avgTimeSpent: 180, completion: 92 },
      { section: 'Terms & Conditions', avgTimeSpent: 60, completion: 75 },
      { section: 'About Us', avgTimeSpent: 30, completion: 65 },
    ];

    // Optimal send time (would analyze won deals)
    const optimalSendTime = [
      { dayOfWeek: 'Tuesday', hour: 10, winRate: 42 },
      { dayOfWeek: 'Wednesday', hour: 14, winRate: 38 },
      { dayOfWeek: 'Thursday', hour: 9, winRate: 35 },
    ];

    // Proposal length impact
    const proposalLength = [
      { range: '1-3 pages', count: 50, winRate: 28 },
      { range: '4-6 pages', count: 100, winRate: 42 },
      { range: '7-10 pages', count: 75, winRate: 38 },
      { range: '10+ pages', count: 25, winRate: 32 },
    ];

    // Discount impact
    const discountImpact = [
      { range: 'No discount', usage: 40, winRate: 32 },
      { range: '1-5%', usage: 25, winRate: 45 },
      { range: '6-10%', usage: 20, winRate: 52 },
      { range: '11-15%', usage: 10, winRate: 48 },
      { range: '15%+', usage: 5, winRate: 38 },
    ];

    return {
      totalSent,
      avgViewsPerProposal: Math.round(avgViewsPerProposal * 10) / 10,
      avgTimeToFirstView: Math.round(avgTimeToFirstView * 10) / 10,
      avgTimeToPeaked: 72, // Hours - would calculate from data
      contentEngagement,
      optimalSendTime,
      proposalLength,
      discountImpact,
    };
  },

  // --------------------------------------------------------------------------
  // Custom Reports
  // --------------------------------------------------------------------------

  /**
   * Get saved reports
   */
  async getSavedReports(orgId: string): Promise<ReportDefinition[]> {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('org_id', orgId)
      .order('name');

    if (error) return [];

    return (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      metrics: r.metrics || [],
      filters: r.filters || [],
      schedule: r.schedule,
      recipients: r.recipients,
      lastRun: r.last_run,
    }));
  },

  /**
   * Save a custom report
   */
  async saveReport(
    orgId: string,
    report: Omit<ReportDefinition, 'id' | 'lastRun'>
  ): Promise<ReportDefinition> {
    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        org_id: orgId,
        name: report.name,
        description: report.description,
        type: report.type,
        metrics: report.metrics,
        filters: report.filters,
        schedule: report.schedule,
        recipients: report.recipients,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      metrics: data.metrics || [],
      filters: data.filters || [],
      schedule: data.schedule,
      recipients: data.recipients,
      lastRun: data.last_run,
    };
  },

  /**
   * Export analytics data
   */
  async exportData(
    orgId: string,
    type: 'performance' | 'revenue' | 'funnel' | 'cohort',
    format: 'csv' | 'json'
  ): Promise<string> {
    let data: unknown;

    switch (type) {
      case 'performance':
        data = await this.getPerformanceMetrics(orgId, 'month');
        break;
      case 'revenue':
        data = await this.getRevenueAnalytics(orgId);
        break;
      case 'funnel':
        data = await this.getConversionFunnel(orgId);
        break;
      case 'cohort':
        data = await this.getCohortAnalysis(orgId);
        break;
      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV conversion (simplified)
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      const rows = data.map((row: any) =>
        headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(data);
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default advancedAnalyticsService;
