/**
 * Sommer's Proposal System - Usage Display Components
 * Show quota usage, limits, and upgrade prompts
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { usageService, type UsageSummary, type QuotaStatus } from '@/lib/usage/usageService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// USAGE BAR
// ============================================================================

interface UsageBarProps {
  label: string;
  quota: QuotaStatus;
  showUpgrade?: boolean;
  className?: string;
}

export function UsageBar({ label, quota, showUpgrade = true, className }: UsageBarProps) {
  const getColor = () => {
    if (quota.isUnlimited) return 'bg-green-500';
    if (quota.percentUsed >= 90) return 'bg-red-500';
    if (quota.percentUsed >= 75) return 'bg-amber-500';
    return 'bg-brand-red';
  };

  const formatValue = (value: number) => {
    if (value === -1 || value === Infinity) return '∞';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {formatValue(quota.used)} / {formatValue(quota.limit)}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor())}
            style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
          />
        </div>
        {quota.isExceeded && showUpgrade && (
          <div className="absolute -right-1 -top-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>
        )}
      </div>
      {quota.isExceeded && showUpgrade && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached. Upgrade for more.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// USAGE SUMMARY CARD
// ============================================================================

interface UsageSummaryCardProps {
  className?: string;
}

export function UsageSummaryCard({ className }: UsageSummaryCardProps) {
  const { organization } = useAuth();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      if (!organization?.id) return;
      try {
        const data = await usageService.getUsageSummary(organization.id);
        setSummary(data);
      } catch (error) {
        console.error('Failed to load usage:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsage();
  }, [organization?.id]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-red" />
          Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageBar label="Proposals" quota={summary.proposals} />
        <UsageBar label="AI Calls" quota={summary.aiCalls} />
        <UsageBar label="Team Members" quota={summary.teamMembers} />
        <UsageBar label="Storage" quota={summary.storage} />
        
        {(summary.proposals.percentUsed >= 75 || summary.aiCalls.percentUsed >= 75) && (
          <div className="pt-2 border-t dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = '/settings/billing'}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Upgrade for more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT USAGE INDICATOR
// ============================================================================

interface CompactUsageIndicatorProps {
  type: 'proposals' | 'aiCalls' | 'storage' | 'teamMembers';
  className?: string;
}

export function CompactUsageIndicator({ type, className }: CompactUsageIndicatorProps) {
  const { organization } = useAuth();
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    async function loadQuota() {
      if (!organization?.id) return;
      try {
        const summary = await usageService.getUsageSummary(organization.id);
        setQuota(summary[type]);
      } catch (error) {
        console.error('Failed to load quota:', error);
      }
    }
    loadQuota();
  }, [organization?.id, type]);

  if (!quota) return null;

  const getColorClass = () => {
    if (quota.isUnlimited) return 'text-green-600 dark:text-green-400';
    if (quota.percentUsed >= 90) return 'text-red-600 dark:text-red-400';
    if (quota.percentUsed >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <span className={cn('text-sm', getColorClass(), className)}>
      {quota.used}/{quota.isUnlimited ? '∞' : quota.limit}
    </span>
  );
}

// ============================================================================
// QUOTA WARNING BANNER
// ============================================================================

interface QuotaWarningBannerProps {
  type: 'proposals' | 'aiCalls';
  onUpgrade?: () => void;
}

export function QuotaWarningBanner({ type, onUpgrade }: QuotaWarningBannerProps) {
  const { organization } = useAuth();
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    async function checkQuota() {
      if (!organization?.id) return;
      try {
        const summary = await usageService.getUsageSummary(organization.id);
        setQuota(summary[type]);
      } catch (error) {
        console.error('Failed to check quota:', error);
      }
    }
    checkQuota();
  }, [organization?.id, type]);

  if (!quota || quota.isUnlimited || quota.percentUsed < 80) return null;

  const typeLabels = {
    proposals: 'proposal',
    aiCalls: 'AI',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg',
        quota.isExceeded
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      )}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className={cn(
            'w-5 h-5',
            quota.isExceeded ? 'text-red-600' : 'text-amber-600'
          )}
        />
        <div>
          <p
            className={cn(
              'font-medium',
              quota.isExceeded
                ? 'text-red-800 dark:text-red-200'
                : 'text-amber-800 dark:text-amber-200'
            )}
          >
            {quota.isExceeded
              ? `You've reached your ${typeLabels[type]} limit`
              : `You're approaching your ${typeLabels[type]} limit`}
          </p>
          <p
            className={cn(
              'text-sm',
              quota.isExceeded
                ? 'text-red-600 dark:text-red-300'
                : 'text-amber-600 dark:text-amber-300'
            )}
          >
            {quota.used} of {quota.limit} used ({Math.round(quota.percentUsed)}%)
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={quota.isExceeded ? 'default' : 'outline'}
        onClick={onUpgrade || (() => window.location.href = '/settings/billing')}
        leftIcon={<Zap className="w-4 h-4" />}
      >
        Upgrade
      </Button>
    </div>
  );
}

// ============================================================================
// USAGE MINI CHART
// ============================================================================

interface UsageMiniChartProps {
  data: { date: string; count: number }[];
  className?: string;
}

export function UsageMiniChart({ data, className }: UsageMiniChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className={cn('flex items-end gap-0.5 h-8', className)}>
      {data.slice(-14).map((point, i) => (
        <div
          key={i}
          className="flex-1 bg-brand-red/20 hover:bg-brand-red/40 transition-colors rounded-t"
          style={{
            height: `${(point.count / max) * 100}%`,
            minHeight: point.count > 0 ? '4px' : '2px',
          }}
          title={`${point.date}: ${point.count}`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UsageBar;
