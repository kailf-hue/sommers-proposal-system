/**
 * Reports Service
 * Custom report generation
 */

import { supabase } from '@/lib/supabase';
import { getDashboardStats, getRevenueTrends, getSalesRepPerformance } from '@/lib/analytics';

export interface ReportConfig {
  id: string;
  org_id: string;
  name: string;
  type: 'revenue' | 'proposals' | 'clients' | 'jobs' | 'custom';
  filters: Record<string, any>;
  columns: string[];
  schedule?: { frequency: string; email_to: string[] };
  created_by: string;
  created_at: string;
}

export interface ReportResult {
  title: string;
  generatedAt: string;
  filters: Record<string, any>;
  data: any[];
  summary?: Record<string, any>;
}

// Generate report
export async function generateReport(
  orgId: string,
  type: string,
  filters: Record<string, any>
): Promise<ReportResult> {
  const generatedAt = new Date().toISOString();

  switch (type) {
    case 'revenue':
      return generateRevenueReport(orgId, filters);
    case 'proposals':
      return generateProposalsReport(orgId, filters);
    case 'sales_performance':
      return generateSalesPerformanceReport(orgId, filters);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

// Revenue report
async function generateRevenueReport(
  orgId: string,
  filters: Record<string, any>
): Promise<ReportResult> {
  const days = filters.days || 30;
  const trends = await getRevenueTrends(orgId, days);
  const stats = await getDashboardStats(orgId);

  return {
    title: 'Revenue Report',
    generatedAt: new Date().toISOString(),
    filters,
    data: trends,
    summary: {
      totalRevenue: stats.totalRevenue,
      revenueThisMonth: stats.revenueThisMonth,
      growth: stats.revenueGrowth,
    },
  };
}

// Proposals report
async function generateProposalsReport(
  orgId: string,
  filters: Record<string, any>
): Promise<ReportResult> {
  let query = supabase
    .from('proposals')
    .select(`
      id, proposal_number, property_name, status, tier, total, created_at,
      contact:contacts(first_name, last_name),
      created_by_user:team_members!created_by(first_name, last_name)
    `)
    .eq('org_id', orgId);

  if (filters.status) query = query.in('status', filters.status);
  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate);
  if (filters.tier) query = query.in('tier', filters.tier);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const total = data?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
  const accepted = data?.filter((p) => p.status === 'accepted') || [];

  return {
    title: 'Proposals Report',
    generatedAt: new Date().toISOString(),
    filters,
    data: data || [],
    summary: {
      totalProposals: data?.length || 0,
      totalValue: total,
      acceptedCount: accepted.length,
      acceptedValue: accepted.reduce((sum, p) => sum + (p.total || 0), 0),
      winRate: data?.length ? (accepted.length / data.length) * 100 : 0,
    },
  };
}

// Sales performance report
async function generateSalesPerformanceReport(
  orgId: string,
  filters: Record<string, any>
): Promise<ReportResult> {
  const performance = await getSalesRepPerformance(orgId);

  return {
    title: 'Sales Performance Report',
    generatedAt: new Date().toISOString(),
    filters,
    data: performance,
    summary: {
      totalReps: performance.length,
      totalRevenue: performance.reduce((sum, p) => sum + p.revenue, 0),
      avgWinRate: performance.reduce((sum, p) => sum + p.winRate, 0) / (performance.length || 1),
    },
  };
}

// Export report to CSV
export function exportToCSV(report: ReportResult): string {
  if (!report.data.length) return '';

  const headers = Object.keys(report.data[0]);
  const rows = report.data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// Save report config
export async function saveReportConfig(
  orgId: string,
  userId: string,
  config: Partial<ReportConfig>
): Promise<ReportConfig> {
  const { data, error } = await supabase
    .from('saved_reports')
    .insert({
      org_id: orgId,
      created_by: userId,
      name: config.name || 'New Report',
      type: config.type || 'custom',
      filters: config.filters || {},
      columns: config.columns || [],
      schedule: config.schedule,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get saved reports
export async function getSavedReports(orgId: string): Promise<ReportConfig[]> {
  const { data, error } = await supabase
    .from('saved_reports')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (error) throw error;
  return data || [];
}

export default {
  generateReport,
  exportToCSV,
  saveReportConfig,
  getSavedReports,
};
