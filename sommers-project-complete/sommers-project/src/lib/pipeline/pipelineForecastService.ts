/**
 * Sommer's Proposal System - Pipeline Forecasting Service
 * Phase 42: Sales forecasting, pipeline analytics, and predictions
 */

import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineForecast {
  summary: ForecastSummary;
  byStage: StageForecast[];
  byMonth: MonthlyForecast[];
  byRep: RepForecast[];
  scenarios: ForecastScenario[];
  trends: ForecastTrend[];
  deals: ForecastDeal[];
}

export interface ForecastSummary {
  totalPipeline: number;
  weightedPipeline: number;
  expectedClose: number;
  bestCase: number;
  worstCase: number;
  averageDealSize: number;
  averageCycleTime: number;
  winProbability: number;
  dealsInPipeline: number;
  dealsClosingThisMonth: number;
  dealsClosingThisQuarter: number;
}

export interface StageForecast {
  stage: string;
  stageOrder: number;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
  avgDaysInStage: number;
  conversionRate: number;
  color: string;
}

export interface MonthlyForecast {
  month: string;
  year: number;
  expectedValue: number;
  weightedValue: number;
  bestCase: number;
  worstCase: number;
  dealCount: number;
  closedValue: number;
  target?: number;
}

export interface RepForecast {
  repId: string;
  repName: string;
  totalPipeline: number;
  weightedPipeline: number;
  expectedClose: number;
  dealCount: number;
  winRate: number;
  avgDealSize: number;
  quota?: number;
  quotaAttainment?: number;
}

export interface ForecastScenario {
  name: string;
  description: string;
  probability: number;
  value: number;
  assumptions: string[];
}

export interface ForecastTrend {
  date: string;
  pipelineValue: number;
  weightedValue: number;
  dealsAdded: number;
  dealsWon: number;
  dealsLost: number;
}

export interface ForecastDeal {
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
  lastActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

export interface ForecastSettings {
  defaultProbabilities: Record<string, number>;
  salesCycleDays: number;
  quotaSettings: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
  seasonalFactors: Record<string, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'lead', name: 'Lead', order: 1, probability: 10, color: '#6B7280' },
  { id: 'qualified', name: 'Qualified', order: 2, probability: 25, color: '#3B82F6' },
  { id: 'proposal', name: 'Proposal Sent', order: 3, probability: 50, color: '#8B5CF6' },
  { id: 'negotiation', name: 'Negotiation', order: 4, probability: 75, color: '#F59E0B' },
  { id: 'verbal', name: 'Verbal Commit', order: 5, probability: 90, color: '#10B981' },
  { id: 'closed_won', name: 'Closed Won', order: 6, probability: 100, color: '#22C55E' },
  { id: 'closed_lost', name: 'Closed Lost', order: 7, probability: 0, color: '#EF4444' },
];

// ============================================================================
// PIPELINE FORECASTING SERVICE
// ============================================================================

export const pipelineForecastService = {
  // --------------------------------------------------------------------------
  // Forecast Generation
  // --------------------------------------------------------------------------

  /**
   * Generate complete pipeline forecast
   */
  async generateForecast(
    orgId: string,
    options?: { months?: number; includeDeals?: boolean }
  ): Promise<PipelineForecast> {
    const months = options?.months || 6;

    const [
      summary,
      byStage,
      byMonth,
      byRep,
      scenarios,
      trends,
      deals,
    ] = await Promise.all([
      this.getForecastSummary(orgId),
      this.getStageForecast(orgId),
      this.getMonthlyForecast(orgId, months),
      this.getRepForecast(orgId),
      this.getScenarios(orgId),
      this.getTrends(orgId, 30),
      options?.includeDeals !== false ? this.getForecastDeals(orgId) : Promise.resolve([]),
    ]);

    return {
      summary,
      byStage,
      byMonth,
      byRep,
      scenarios,
      trends,
      deals,
    };
  },

  /**
   * Get forecast summary
   */
  async getForecastSummary(orgId: string): Promise<ForecastSummary> {
    const stages = await this.getStages(orgId);
    const activeStages = stages.filter(s => s.id !== 'closed_won' && s.id !== 'closed_lost');

    // Get all active proposals
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, total_amount, stage, expected_close_date, created_at, updated_at')
      .eq('org_id', orgId)
      .in('stage', activeStages.map(s => s.id));

    if (!proposals || proposals.length === 0) {
      return this.getEmptyForecastSummary();
    }

    // Calculate metrics
    const totalPipeline = proposals.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    
    const weightedPipeline = proposals.reduce((sum, p) => {
      const stage = stages.find(s => s.id === p.stage);
      const probability = stage?.probability || 50;
      return sum + (p.total_amount || 0) * (probability / 100);
    }, 0);

    // Expected close (high probability deals)
    const highProbDeals = proposals.filter(p => {
      const stage = stages.find(s => s.id === p.stage);
      return (stage?.probability || 0) >= 75;
    });
    const expectedClose = highProbDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0);

    // Scenarios
    const bestCase = totalPipeline;
    const worstCase = proposals
      .filter(p => {
        const stage = stages.find(s => s.id === p.stage);
        return (stage?.probability || 0) >= 50;
      })
      .reduce((sum, p) => sum + (p.total_amount || 0) * 0.7, 0);

    // Averages
    const averageDealSize = totalPipeline / proposals.length;

    // Cycle time (from won deals)
    const { data: wonDeals } = await supabase
      .from('proposals')
      .select('created_at, updated_at')
      .eq('org_id', orgId)
      .eq('stage', 'closed_won')
      .limit(50);

    const cycleTimes = (wonDeals || []).map(d => {
      const created = new Date(d.created_at);
      const closed = new Date(d.updated_at);
      return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageCycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 30;

    // Win probability (historical)
    const { count: totalClosed } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('stage', ['closed_won', 'closed_lost']);

    const { count: wonCount } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('stage', 'closed_won');

    const winProbability = totalClosed && totalClosed > 0
      ? ((wonCount || 0) / totalClosed) * 100
      : 50;

    // Deals closing soon
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfQuarter = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0);

    const dealsClosingThisMonth = proposals.filter(p => {
      if (!p.expected_close_date) return false;
      return new Date(p.expected_close_date) <= endOfMonth;
    }).length;

    const dealsClosingThisQuarter = proposals.filter(p => {
      if (!p.expected_close_date) return false;
      return new Date(p.expected_close_date) <= endOfQuarter;
    }).length;

    return {
      totalPipeline,
      weightedPipeline: Math.round(weightedPipeline),
      expectedClose: Math.round(expectedClose),
      bestCase: Math.round(bestCase),
      worstCase: Math.round(worstCase),
      averageDealSize: Math.round(averageDealSize),
      averageCycleTime: Math.round(averageCycleTime),
      winProbability: Math.round(winProbability),
      dealsInPipeline: proposals.length,
      dealsClosingThisMonth,
      dealsClosingThisQuarter,
    };
  },

  /**
   * Get empty forecast summary
   */
  getEmptyForecastSummary(): ForecastSummary {
    return {
      totalPipeline: 0,
      weightedPipeline: 0,
      expectedClose: 0,
      bestCase: 0,
      worstCase: 0,
      averageDealSize: 0,
      averageCycleTime: 0,
      winProbability: 0,
      dealsInPipeline: 0,
      dealsClosingThisMonth: 0,
      dealsClosingThisQuarter: 0,
    };
  },

  /**
   * Get forecast by stage
   */
  async getStageForecast(orgId: string): Promise<StageForecast[]> {
    const stages = await this.getStages(orgId);

    const forecasts: StageForecast[] = [];

    for (const stage of stages) {
      if (stage.id === 'closed_won' || stage.id === 'closed_lost') continue;

      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, total_amount, created_at, updated_at, stage')
        .eq('org_id', orgId)
        .eq('stage', stage.id);

      const dealCount = proposals?.length || 0;
      const totalValue = proposals?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const weightedValue = totalValue * (stage.probability / 100);

      // Calculate average days in stage
      const avgDaysInStage = proposals?.length
        ? proposals.reduce((sum, p) => {
            const entered = new Date(p.updated_at); // Simplified - would need stage_entered_at
            return sum + (Date.now() - entered.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / proposals.length
        : 0;

      // Conversion rate from historical data
      const { count: enteredCount } = await supabase
        .from('stage_history')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('stage', stage.id);

      const { count: progressedCount } = await supabase
        .from('stage_history')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('from_stage', stage.id)
        .neq('to_stage', 'closed_lost');

      const conversionRate = enteredCount && enteredCount > 0
        ? ((progressedCount || 0) / enteredCount) * 100
        : stage.probability;

      forecasts.push({
        stage: stage.name,
        stageOrder: stage.order,
        dealCount,
        totalValue,
        weightedValue: Math.round(weightedValue),
        avgDaysInStage: Math.round(avgDaysInStage),
        conversionRate: Math.round(conversionRate),
        color: stage.color,
      });
    }

    return forecasts.sort((a, b) => a.stageOrder - b.stageOrder);
  },

  /**
   * Get monthly forecast
   */
  async getMonthlyForecast(orgId: string, months: number): Promise<MonthlyForecast[]> {
    const stages = await this.getStages(orgId);
    const forecasts: MonthlyForecast[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      // Get deals expected to close this month
      const { data: expectedDeals } = await supabase
        .from('proposals')
        .select('id, total_amount, stage')
        .eq('org_id', orgId)
        .not('stage', 'in', '("closed_won","closed_lost")')
        .gte('expected_close_date', targetMonth.toISOString())
        .lte('expected_close_date', endOfMonth.toISOString());

      // Get already closed deals for this month
      const { data: closedDeals } = await supabase
        .from('proposals')
        .select('total_amount')
        .eq('org_id', orgId)
        .eq('stage', 'closed_won')
        .gte('updated_at', targetMonth.toISOString())
        .lte('updated_at', endOfMonth.toISOString());

      const expectedValue = expectedDeals?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;
      
      const weightedValue = expectedDeals?.reduce((sum, d) => {
        const stage = stages.find(s => s.id === d.stage);
        return sum + (d.total_amount || 0) * ((stage?.probability || 50) / 100);
      }, 0) || 0;

      const closedValue = closedDeals?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

      // Scenario calculations
      const bestCase = expectedValue;
      const worstCase = weightedValue * 0.7;

      forecasts.push({
        month: targetMonth.toLocaleDateString('en-US', { month: 'short' }),
        year: targetMonth.getFullYear(),
        expectedValue,
        weightedValue: Math.round(weightedValue),
        bestCase: Math.round(bestCase),
        worstCase: Math.round(worstCase),
        dealCount: expectedDeals?.length || 0,
        closedValue,
      });
    }

    return forecasts;
  },

  /**
   * Get forecast by sales rep
   */
  async getRepForecast(orgId: string): Promise<RepForecast[]> {
    const stages = await this.getStages(orgId);

    // Get team members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, name, quota_monthly')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (!teamMembers) return [];

    const forecasts: RepForecast[] = [];

    for (const rep of teamMembers) {
      // Get rep's pipeline
      const { data: pipeline } = await supabase
        .from('proposals')
        .select('id, total_amount, stage')
        .eq('org_id', orgId)
        .eq('assigned_to', rep.id)
        .not('stage', 'in', '("closed_won","closed_lost")');

      // Get rep's won deals
      const { data: wonDeals } = await supabase
        .from('proposals')
        .select('total_amount')
        .eq('org_id', orgId)
        .eq('assigned_to', rep.id)
        .eq('stage', 'closed_won');

      // Get rep's lost deals
      const { data: lostDeals } = await supabase
        .from('proposals')
        .select('id')
        .eq('org_id', orgId)
        .eq('assigned_to', rep.id)
        .eq('stage', 'closed_lost');

      const totalPipeline = pipeline?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      
      const weightedPipeline = pipeline?.reduce((sum, p) => {
        const stage = stages.find(s => s.id === p.stage);
        return sum + (p.total_amount || 0) * ((stage?.probability || 50) / 100);
      }, 0) || 0;

      const highProbDeals = pipeline?.filter(p => {
        const stage = stages.find(s => s.id === p.stage);
        return (stage?.probability || 0) >= 75;
      }) || [];
      const expectedClose = highProbDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0);

      const wonCount = wonDeals?.length || 0;
      const lostCount = lostDeals?.length || 0;
      const winRate = wonCount + lostCount > 0
        ? (wonCount / (wonCount + lostCount)) * 100
        : 0;

      const avgDealSize = pipeline?.length
        ? totalPipeline / pipeline.length
        : 0;

      const quota = rep.quota_monthly || 0;
      const quotaAttainment = quota > 0
        ? ((wonDeals?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0) / quota) * 100
        : 0;

      forecasts.push({
        repId: rep.id,
        repName: rep.name,
        totalPipeline,
        weightedPipeline: Math.round(weightedPipeline),
        expectedClose: Math.round(expectedClose),
        dealCount: pipeline?.length || 0,
        winRate: Math.round(winRate),
        avgDealSize: Math.round(avgDealSize),
        quota,
        quotaAttainment: Math.round(quotaAttainment),
      });
    }

    return forecasts.sort((a, b) => b.weightedPipeline - a.weightedPipeline);
  },

  /**
   * Get forecast scenarios
   */
  async getScenarios(orgId: string): Promise<ForecastScenario[]> {
    const summary = await this.getForecastSummary(orgId);

    return [
      {
        name: 'Best Case',
        description: 'All deals close at full value',
        probability: 15,
        value: summary.bestCase,
        assumptions: [
          'All proposals accepted',
          'No price negotiations',
          'All expected close dates met',
        ],
      },
      {
        name: 'Most Likely',
        description: 'Weighted by stage probability',
        probability: 60,
        value: summary.weightedPipeline,
        assumptions: [
          'Historical conversion rates apply',
          'Normal sales cycle length',
          'Typical discount levels',
        ],
      },
      {
        name: 'Worst Case',
        description: 'Conservative estimate with delays',
        probability: 25,
        value: summary.worstCase,
        assumptions: [
          'Extended sales cycles',
          'Higher discount requirements',
          'Some deals push to next quarter',
        ],
      },
    ];
  },

  /**
   * Get pipeline trends
   */
  async getTrends(orgId: string, days: number): Promise<ForecastTrend[]> {
    const trends: ForecastTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // In production, this would query historical snapshots
      // For now, generate realistic mock data
      const baseValue = 500000 + Math.sin(i / 7) * 100000;
      const randomFactor = 0.9 + Math.random() * 0.2;

      trends.push({
        date: date.toISOString().split('T')[0],
        pipelineValue: Math.round(baseValue * randomFactor),
        weightedValue: Math.round(baseValue * randomFactor * 0.5),
        dealsAdded: Math.floor(Math.random() * 5) + 1,
        dealsWon: Math.floor(Math.random() * 3),
        dealsLost: Math.floor(Math.random() * 2),
      });
    }

    return trends;
  },

  /**
   * Get forecast deals
   */
  async getForecastDeals(orgId: string): Promise<ForecastDeal[]> {
    const stages = await this.getStages(orgId);

    const { data: proposals } = await supabase
      .from('proposals')
      .select(`
        id,
        proposal_number,
        total_amount,
        stage,
        expected_close_date,
        updated_at,
        created_at,
        clients (name),
        team_members (name)
      `)
      .eq('org_id', orgId)
      .not('stage', 'in', '("closed_won","closed_lost")')
      .order('total_amount', { ascending: false })
      .limit(50);

    if (!proposals) return [];

    return proposals.map((p) => {
      const stage = stages.find(s => s.id === p.stage);
      const probability = stage?.probability || 50;
      const daysInStage = Math.round(
        (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Risk assessment
      const riskFactors: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      if (daysInStage > 30) {
        riskFactors.push('Stale deal (>30 days in stage)');
        riskLevel = 'medium';
      }
      if (daysInStage > 60) {
        riskLevel = 'high';
      }
      if (!p.expected_close_date) {
        riskFactors.push('No expected close date');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      if (p.expected_close_date && new Date(p.expected_close_date) < new Date()) {
        riskFactors.push('Past expected close date');
        riskLevel = 'high';
      }

      return {
        id: p.id,
        proposalNumber: p.proposal_number,
        clientName: (p.clients as any)?.name || 'Unknown',
        value: p.total_amount || 0,
        stage: stage?.name || p.stage,
        probability,
        weightedValue: Math.round((p.total_amount || 0) * (probability / 100)),
        expectedCloseDate: p.expected_close_date || '',
        daysInStage,
        repName: (p.team_members as any)?.name || 'Unassigned',
        lastActivity: p.updated_at,
        riskLevel,
        riskFactors,
      };
    });
  },

  // --------------------------------------------------------------------------
  // Stage Management
  // --------------------------------------------------------------------------

  /**
   * Get pipeline stages
   */
  async getStages(orgId: string): Promise<PipelineStage[]> {
    const { data } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('org_id', orgId)
      .order('order');

    if (!data || data.length === 0) {
      return DEFAULT_STAGES;
    }

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      probability: s.probability,
      color: s.color,
    }));
  },

  /**
   * Update deal probability
   */
  async updateDealProbability(
    proposalId: string,
    probability: number
  ): Promise<void> {
    await supabase
      .from('proposals')
      .update({
        custom_probability: probability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);
  },

  /**
   * Update expected close date
   */
  async updateExpectedCloseDate(
    proposalId: string,
    date: string
  ): Promise<void> {
    await supabase
      .from('proposals')
      .update({
        expected_close_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);
  },

  // --------------------------------------------------------------------------
  // AI-Powered Predictions
  // --------------------------------------------------------------------------

  /**
   * Get AI deal prediction
   */
  async predictDealOutcome(
    proposalId: string
  ): Promise<{
    probability: number;
    confidence: number;
    factors: { name: string; impact: number; direction: 'positive' | 'negative' }[];
    recommendations: string[];
  }> {
    // In production, this would call an ML model
    // For now, return rule-based prediction
    const { data: proposal } = await supabase
      .from('proposals')
      .select(`
        *,
        clients (
          proposals (id, status)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (!proposal) {
      return {
        probability: 50,
        confidence: 0,
        factors: [],
        recommendations: [],
      };
    }

    const factors: { name: string; impact: number; direction: 'positive' | 'negative' }[] = [];
    let probability = 50;

    // Client history
    const clientProposals = (proposal.clients as any)?.proposals || [];
    const acceptedCount = clientProposals.filter((p: any) => p.status === 'accepted').length;
    if (acceptedCount > 0) {
      probability += 15;
      factors.push({ name: 'Repeat client', impact: 15, direction: 'positive' });
    }

    // Deal size (larger deals often harder to close)
    const avgDealSize = 15000; // Would calculate from org data
    if ((proposal.total_amount || 0) > avgDealSize * 2) {
      probability -= 10;
      factors.push({ name: 'Large deal size', impact: 10, direction: 'negative' });
    }

    // Days since sent
    const daysSinceSent = proposal.sent_at
      ? (Date.now() - new Date(proposal.sent_at).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSinceSent < 7) {
      probability += 10;
      factors.push({ name: 'Recently sent', impact: 10, direction: 'positive' });
    } else if (daysSinceSent > 30) {
      probability -= 15;
      factors.push({ name: 'Aging proposal', impact: 15, direction: 'negative' });
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (daysSinceSent > 7 && daysSinceSent < 14) {
      recommendations.push('Consider sending a follow-up email');
    }
    if (daysSinceSent > 14) {
      recommendations.push('Schedule a call to re-engage the client');
    }
    if (!proposal.discount_amount && (proposal.total_amount || 0) > avgDealSize) {
      recommendations.push('Consider offering a small discount to accelerate decision');
    }

    return {
      probability: Math.min(95, Math.max(5, probability)),
      confidence: factors.length > 2 ? 75 : 50,
      factors,
      recommendations,
    };
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default pipelineForecastService;
