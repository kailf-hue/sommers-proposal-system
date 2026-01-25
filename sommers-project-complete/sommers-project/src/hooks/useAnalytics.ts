/**
 * Analytics Hooks
 * React Query hooks for analytics and reporting
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as analyticsService from '@/lib/analytics';

// Dashboard stats
export function useDashboardStats() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', organization?.id],
    queryFn: () => analyticsService.getDashboardStats(organization!.id),
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Revenue trends
export function useRevenueTrends(days: number = 30) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['revenue-trends', organization?.id, days],
    queryFn: () => analyticsService.getRevenueTrends(organization!.id, days),
    enabled: !!organization?.id,
  });
}

// Pipeline metrics
export function usePipelineMetrics() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['pipeline-metrics', organization?.id],
    queryFn: () => analyticsService.getPipelineMetrics(organization!.id),
    enabled: !!organization?.id,
  });
}

// Sales rep performance
export function useSalesPerformance() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['sales-performance', organization?.id],
    queryFn: () => analyticsService.getSalesRepPerformance(organization!.id),
    enabled: !!organization?.id,
  });
}

// Service breakdown
export function useServiceBreakdown() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['service-breakdown', organization?.id],
    queryFn: () => analyticsService.getServiceBreakdown(organization!.id),
    enabled: !!organization?.id,
  });
}

// Tier distribution
export function useTierDistribution() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['tier-distribution', organization?.id],
    queryFn: () => analyticsService.getTierDistribution(organization!.id),
    enabled: !!organization?.id,
  });
}

// Proposal funnel
export function useProposalFunnel() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['proposal-funnel', organization?.id],
    queryFn: () => analyticsService.getProposalFunnel(organization!.id),
    enabled: !!organization?.id,
  });
}
