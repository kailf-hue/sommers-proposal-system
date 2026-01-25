/**
 * Analytics Service
 * Business analytics and reporting logic
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  totalProposals: number;
  proposalsThisMonth: number;
  proposalGrowth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  activeClients: number;
  clientGrowth: number;
  winRate: number;
  winRateChange: number;
  avgDealSize: number;
  avgDealSizeChange: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  proposals: number;
  accepted: number;
}

export interface PipelineMetrics {
  stage: string;
  count: number;
  value: number;
  avgAge: number;
}

export interface SalesRepPerformance {
  id: string;
  name: string;
  avatar: string | null;
  proposalsSent: number;
  proposalsWon: number;
  winRate: number;
  revenue: number;
  avgDealSize: number;
}

export interface ServiceBreakdown {
  service: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface TierDistribution {
  tier: 'economy' | 'standard' | 'premium';
  count: number;
  revenue: number;
  percentage: number;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get proposal counts
  const { count: totalProposals } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const { count: proposalsThisMonth } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth.toISOString());

  const { count: proposalsLastMonth } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());

  // Get revenue
  const { data: revenueData } = await supabase
    .from('proposals')
    .select('total, created_at')
    .eq('org_id', orgId)
    .eq('status', 'accepted');

  const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
  
  const revenueThisMonth = revenueData
    ?.filter(p => new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + (p.total || 0), 0) || 0;

  const revenueLastMonth = revenueData
    ?.filter(p => new Date(p.created_at) >= startOfLastMonth && new Date(p.created_at) < startOfMonth)
    .reduce((sum, p) => sum + (p.total || 0), 0) || 0;

  // Get client count
  const { count: activeClients } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  // Calculate win rate
  const { count: acceptedCount } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'accepted');

  const { count: sentCount } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('status', ['sent', 'viewed', 'accepted', 'rejected']);

  const winRate = sentCount ? ((acceptedCount || 0) / sentCount) * 100 : 0;

  // Calculate growth percentages
  const proposalGrowth = proposalsLastMonth 
    ? ((proposalsThisMonth || 0) - proposalsLastMonth) / proposalsLastMonth * 100 
    : 0;

  const revenueGrowth = revenueLastMonth 
    ? (revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100 
    : 0;

  return {
    totalProposals: totalProposals || 0,
    proposalsThisMonth: proposalsThisMonth || 0,
    proposalGrowth,
    totalRevenue,
    revenueThisMonth,
    revenueGrowth,
    activeClients: activeClients || 0,
    clientGrowth: 5.2, // TODO: Calculate properly
    winRate,
    winRateChange: 2.1, // TODO: Calculate properly
    avgDealSize: totalRevenue / (acceptedCount || 1),
    avgDealSizeChange: 3.5, // TODO: Calculate properly
  };
}

// ============================================================================
// REVENUE TRENDS
// ============================================================================

export async function getRevenueTrends(
  orgId: string,
  days: number = 30
): Promise<RevenueDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: proposals } = await supabase
    .from('proposals')
    .select('total, status, created_at')
    .eq('org_id', orgId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const dataByDate: Record<string, RevenueDataPoint> = {};

  proposals?.forEach((p) => {
    const date = new Date(p.created_at).toISOString().split('T')[0];
    
    if (!dataByDate[date]) {
      dataByDate[date] = { date, revenue: 0, proposals: 0, accepted: 0 };
    }
    
    dataByDate[date].proposals++;
    
    if (p.status === 'accepted') {
      dataByDate[date].revenue += p.total || 0;
      dataByDate[date].accepted++;
    }
  });

  return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// PIPELINE METRICS
// ============================================================================

export async function getPipelineMetrics(orgId: string): Promise<PipelineMetrics[]> {
  const { data: stages } = await supabase
    .from('deal_stages')
    .select('id, name, position')
    .eq('org_id', orgId)
    .order('position');

  const { data: deals } = await supabase
    .from('deals')
    .select('stage_id, value, created_at')
    .eq('org_id', orgId);

  const now = new Date();

  return (stages || []).map((stage) => {
    const stageDeals = deals?.filter((d) => d.stage_id === stage.id) || [];
    const totalAge = stageDeals.reduce((sum, d) => {
      const age = (now.getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return sum + age;
    }, 0);

    return {
      stage: stage.name,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      avgAge: stageDeals.length ? totalAge / stageDeals.length : 0,
    };
  });
}

// ============================================================================
// SALES REP PERFORMANCE
// ============================================================================

export async function getSalesRepPerformance(orgId: string): Promise<SalesRepPerformance[]> {
  const { data: members } = await supabase
    .from('team_members')
    .select('id, first_name, last_name, avatar_url')
    .eq('org_id', orgId)
    .in('role', ['owner', 'admin', 'manager', 'sales']);

  const { data: proposals } = await supabase
    .from('proposals')
    .select('created_by, status, total')
    .eq('org_id', orgId)
    .in('status', ['sent', 'viewed', 'accepted', 'rejected']);

  return (members || []).map((member) => {
    const memberProposals = proposals?.filter((p) => p.created_by === member.id) || [];
    const sentCount = memberProposals.length;
    const wonProposals = memberProposals.filter((p) => p.status === 'accepted');
    const wonCount = wonProposals.length;
    const revenue = wonProposals.reduce((sum, p) => sum + (p.total || 0), 0);

    return {
      id: member.id,
      name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
      avatar: member.avatar_url,
      proposalsSent: sentCount,
      proposalsWon: wonCount,
      winRate: sentCount ? (wonCount / sentCount) * 100 : 0,
      revenue,
      avgDealSize: wonCount ? revenue / wonCount : 0,
    };
  });
}

// ============================================================================
// SERVICE BREAKDOWN
// ============================================================================

export async function getServiceBreakdown(orgId: string): Promise<ServiceBreakdown[]> {
  const { data: lineItems } = await supabase
    .from('proposal_line_items')
    .select(`
      service_id,
      total,
      proposals!inner(org_id, status)
    `)
    .eq('proposals.org_id', orgId)
    .eq('proposals.status', 'accepted');

  const serviceMap: Record<string, { count: number; revenue: number }> = {};

  lineItems?.forEach((item) => {
    const serviceId = item.service_id || 'other';
    if (!serviceMap[serviceId]) {
      serviceMap[serviceId] = { count: 0, revenue: 0 };
    }
    serviceMap[serviceId].count++;
    serviceMap[serviceId].revenue += item.total || 0;
  });

  const totalRevenue = Object.values(serviceMap).reduce((sum, s) => sum + s.revenue, 0);

  return Object.entries(serviceMap).map(([service, data]) => ({
    service,
    count: data.count,
    revenue: data.revenue,
    percentage: totalRevenue ? (data.revenue / totalRevenue) * 100 : 0,
  }));
}

// ============================================================================
// TIER DISTRIBUTION
// ============================================================================

export async function getTierDistribution(orgId: string): Promise<TierDistribution[]> {
  const { data: proposals } = await supabase
    .from('proposals')
    .select('tier, total')
    .eq('org_id', orgId)
    .eq('status', 'accepted');

  const tiers: Record<string, { count: number; revenue: number }> = {
    economy: { count: 0, revenue: 0 },
    standard: { count: 0, revenue: 0 },
    premium: { count: 0, revenue: 0 },
  };

  proposals?.forEach((p) => {
    const tier = p.tier || 'standard';
    if (tiers[tier]) {
      tiers[tier].count++;
      tiers[tier].revenue += p.total || 0;
    }
  });

  const totalCount = Object.values(tiers).reduce((sum, t) => sum + t.count, 0);

  return Object.entries(tiers).map(([tier, data]) => ({
    tier: tier as 'economy' | 'standard' | 'premium',
    count: data.count,
    revenue: data.revenue,
    percentage: totalCount ? (data.count / totalCount) * 100 : 0,
  }));
}

// ============================================================================
// PROPOSAL FUNNEL
// ============================================================================

export async function getProposalFunnel(orgId: string) {
  const statuses = ['draft', 'sent', 'viewed', 'accepted'];
  
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', status);
      
      return { status, count: count || 0 };
    })
  );

  return results;
}

// ============================================================================
// EXPORT REPORT
// ============================================================================

export async function exportAnalyticsReport(
  orgId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  const [stats, revenue, pipeline, reps, services, tiers] = await Promise.all([
    getDashboardStats(orgId),
    getRevenueTrends(orgId, 90),
    getPipelineMetrics(orgId),
    getSalesRepPerformance(orgId),
    getServiceBreakdown(orgId),
    getTierDistribution(orgId),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: stats,
    revenueTrends: revenue,
    pipeline,
    salesPerformance: reps,
    serviceBreakdown: services,
    tierDistribution: tiers,
  };

  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  // Convert to CSV
  const lines = [
    '=== DASHBOARD SUMMARY ===',
    `Total Proposals,${stats.totalProposals}`,
    `Total Revenue,$${stats.totalRevenue}`,
    `Win Rate,${stats.winRate.toFixed(1)}%`,
    `Avg Deal Size,$${stats.avgDealSize.toFixed(2)}`,
    '',
    '=== REVENUE TRENDS ===',
    'Date,Revenue,Proposals,Accepted',
    ...revenue.map((r) => `${r.date},$${r.revenue},${r.proposals},${r.accepted}`),
  ];

  return lines.join('\n');
}
