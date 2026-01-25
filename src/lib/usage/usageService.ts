/**
 * Sommer's Proposal System - Usage Service
 * Phase 30: Usage tracking, quotas, and metering
 */

import { supabase } from '../supabase';
import { entitlementsService, type PlanLimits } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export type UsageEventType =
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'proposal_signed'
  | 'ai_call'
  | 'email_sent'
  | 'sms_sent'
  | 'storage_upload'
  | 'storage_delete'
  | 'api_call'
  | 'team_member_added'
  | 'team_member_removed';

export interface UsageEvent {
  id: string;
  orgId: string;
  userId: string | null;
  eventType: UsageEventType;
  quantity: number;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface UsageRollup {
  id: string;
  orgId: string;
  periodType: 'daily' | 'monthly';
  periodStart: string;
  eventType: UsageEventType;
  totalQuantity: number;
  metadata: Record<string, unknown>;
}

export interface CurrentUsage {
  proposalsThisMonth: number;
  aiCallsThisMonth: number;
  emailsThisMonth: number;
  storageUsedBytes: number;
  teamMembersCount: number;
  periodStart: string;
}

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  isUnlimited: boolean;
  isExceeded: boolean;
}

export interface UsageSummary {
  proposals: QuotaStatus;
  aiCalls: QuotaStatus;
  emails: QuotaStatus;
  storage: QuotaStatus;
  teamMembers: QuotaStatus;
}

// ============================================================================
// USAGE SERVICE
// ============================================================================

export const usageService = {
  // --------------------------------------------------------------------------
  // Event Tracking
  // --------------------------------------------------------------------------

  /**
   * Track a usage event
   */
  async trackEvent(
    orgId: string,
    eventType: UsageEventType,
    options?: {
      userId?: string;
      quantity?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const { error } = await supabase.from('usage_events').insert({
      org_id: orgId,
      user_id: options?.userId,
      event_type: eventType,
      quantity: options?.quantity ?? 1,
      metadata: options?.metadata ?? {},
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;

    // Update current usage snapshot
    await this.updateCurrentUsage(orgId, eventType, options?.quantity ?? 1);
  },

  /**
   * Track multiple events at once
   */
  async trackEvents(
    events: Array<{
      orgId: string;
      eventType: UsageEventType;
      userId?: string;
      quantity?: number;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    const { error } = await supabase.from('usage_events').insert(
      events.map((e) => ({
        org_id: e.orgId,
        user_id: e.userId,
        event_type: e.eventType,
        quantity: e.quantity ?? 1,
        metadata: e.metadata ?? {},
        timestamp: new Date().toISOString(),
      }))
    );

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Current Usage
  // --------------------------------------------------------------------------

  /**
   * Get current usage snapshot for an org
   */
  async getCurrentUsage(orgId: string): Promise<CurrentUsage> {
    const { data, error } = await supabase
      .from('usage_current')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // If no record exists, create one
    if (!data) {
      return this.initializeCurrentUsage(orgId);
    }

    // Check if we need to reset for new month
    const periodStart = new Date(data.period_start);
    const now = new Date();
    if (
      periodStart.getMonth() !== now.getMonth() ||
      periodStart.getFullYear() !== now.getFullYear()
    ) {
      return this.resetCurrentUsage(orgId);
    }

    return transformCurrentUsage(data);
  },

  /**
   * Initialize current usage for a new org
   */
  async initializeCurrentUsage(orgId: string): Promise<CurrentUsage> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from('usage_current')
      .upsert(
        {
          org_id: orgId,
          proposals_this_month: 0,
          ai_calls_this_month: 0,
          emails_this_month: 0,
          storage_used_bytes: 0,
          team_members_count: 1,
          period_start: periodStart.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return transformCurrentUsage(data);
  },

  /**
   * Reset current usage for new month
   */
  async resetCurrentUsage(orgId: string): Promise<CurrentUsage> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Archive previous month's data to rollups first
    await this.archiveMonthlyUsage(orgId);

    const { data, error } = await supabase
      .from('usage_current')
      .update({
        proposals_this_month: 0,
        ai_calls_this_month: 0,
        emails_this_month: 0,
        // Note: storage is NOT reset
        period_start: periodStart.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return transformCurrentUsage(data);
  },

  /**
   * Update current usage snapshot
   */
  async updateCurrentUsage(
    orgId: string,
    eventType: UsageEventType,
    quantity: number
  ): Promise<void> {
    // Map event types to usage fields
    const fieldMap: Record<string, string> = {
      proposal_created: 'proposals_this_month',
      proposal_sent: 'proposals_this_month',
      ai_call: 'ai_calls_this_month',
      email_sent: 'emails_this_month',
      team_member_added: 'team_members_count',
      team_member_removed: 'team_members_count',
      storage_upload: 'storage_used_bytes',
      storage_delete: 'storage_used_bytes',
    };

    const field = fieldMap[eventType];
    if (!field) return;

    // Special handling for storage (bytes) and team members
    if (eventType === 'storage_delete') {
      quantity = -quantity;
    }
    if (eventType === 'team_member_removed') {
      quantity = -1;
    }

    // Use raw SQL for atomic increment
    const { error } = await supabase.rpc('increment_usage', {
      p_org_id: orgId,
      p_field: field,
      p_amount: quantity,
    });

    // If RPC doesn't exist, fall back to manual update
    if (error && error.code === '42883') {
      const current = await this.getCurrentUsage(orgId);
      const currentValue = (current as Record<string, number>)[
        toCamelCase(field)
      ] || 0;

      await supabase
        .from('usage_current')
        .update({
          [field]: Math.max(0, currentValue + quantity),
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);
    }
  },

  // --------------------------------------------------------------------------
  // Quota Checks
  // --------------------------------------------------------------------------

  /**
   * Get full usage summary with quota status
   */
  async getUsageSummary(orgId: string): Promise<UsageSummary> {
    const [usage, limits] = await Promise.all([
      this.getCurrentUsage(orgId),
      entitlementsService.getLimits(orgId),
    ]);

    return {
      proposals: calculateQuotaStatus(
        usage.proposalsThisMonth,
        limits.proposalsPerMonth
      ),
      aiCalls: calculateQuotaStatus(
        usage.aiCallsThisMonth,
        limits.aiCallsPerMonth
      ),
      emails: calculateQuotaStatus(
        usage.emailsThisMonth,
        limits.proposalsPerMonth * 10 // Emails based on proposals
      ),
      storage: calculateQuotaStatus(
        usage.storageUsedBytes / (1024 * 1024), // Convert to MB
        limits.storageMb
      ),
      teamMembers: calculateQuotaStatus(
        usage.teamMembersCount,
        limits.teamMembers
      ),
    };
  },

  /**
   * Check if an action is allowed based on quotas
   */
  async canPerformAction(
    orgId: string,
    action: 'create_proposal' | 'call_ai' | 'send_email' | 'add_team_member' | 'upload_storage',
    quantity: number = 1
  ): Promise<{ allowed: boolean; reason?: string; upgrade?: string }> {
    // Comped orgs bypass all quotas
    const isComped = await entitlementsService.isComped(orgId);
    if (isComped) {
      return { allowed: true };
    }

    const summary = await this.getUsageSummary(orgId);

    const actionMap: Record<string, keyof UsageSummary> = {
      create_proposal: 'proposals',
      call_ai: 'aiCalls',
      send_email: 'emails',
      add_team_member: 'teamMembers',
      upload_storage: 'storage',
    };

    const quotaKey = actionMap[action];
    if (!quotaKey) return { allowed: true };

    const quota = summary[quotaKey];
    if (quota.isUnlimited) return { allowed: true };

    if (quota.remaining < quantity) {
      return {
        allowed: false,
        reason: `You've reached your ${quotaKey} limit for this month`,
        upgrade: 'Upgrade your plan for higher limits',
      };
    }

    return { allowed: true };
  },

  /**
   * Check quota before performing action (throws if exceeded)
   */
  async enforceQuota(
    orgId: string,
    action: 'create_proposal' | 'call_ai' | 'send_email' | 'add_team_member' | 'upload_storage',
    quantity: number = 1
  ): Promise<void> {
    const result = await this.canPerformAction(orgId, action, quantity);
    if (!result.allowed) {
      throw new QuotaExceededError(result.reason!, result.upgrade);
    }
  },

  // --------------------------------------------------------------------------
  // Historical Usage
  // --------------------------------------------------------------------------

  /**
   * Get usage events for a time range
   */
  async getEvents(
    orgId: string,
    options?: {
      eventType?: UsageEventType;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<UsageEvent[]> {
    let query = supabase
      .from('usage_events')
      .select('*')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false });

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    if (options?.startDate) {
      query = query.gte('timestamp', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('timestamp', options.endDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformUsageEvent);
  },

  /**
   * Get usage rollups (aggregated data)
   */
  async getRollups(
    orgId: string,
    periodType: 'daily' | 'monthly',
    options?: {
      eventType?: UsageEventType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<UsageRollup[]> {
    let query = supabase
      .from('usage_rollups')
      .select('*')
      .eq('org_id', orgId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false });

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    if (options?.startDate) {
      query = query.gte('period_start', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('period_start', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformUsageRollup);
  },

  /**
   * Archive monthly usage to rollups
   */
  async archiveMonthlyUsage(orgId: string): Promise<void> {
    // This would typically be run by a scheduled job
    const { data: current } = await supabase
      .from('usage_current')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!current) return;

    const rollups = [
      { type: 'proposal_created', quantity: current.proposals_this_month },
      { type: 'ai_call', quantity: current.ai_calls_this_month },
      { type: 'email_sent', quantity: current.emails_this_month },
    ];

    for (const rollup of rollups) {
      if (rollup.quantity > 0) {
        await supabase.from('usage_rollups').upsert(
          {
            org_id: orgId,
            period_type: 'monthly',
            period_start: current.period_start,
            event_type: rollup.type,
            total_quantity: rollup.quantity,
          },
          { onConflict: 'org_id,period_type,period_start,event_type' }
        );
      }
    }
  },

  // --------------------------------------------------------------------------
  // Usage Analytics
  // --------------------------------------------------------------------------

  /**
   * Get usage trends for charting
   */
  async getUsageTrends(
    orgId: string,
    eventType: UsageEventType,
    days: number = 30
  ): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('usage_events')
      .select('timestamp, quantity')
      .eq('org_id', orgId)
      .eq('event_type', eventType)
      .gte('timestamp', startDate.toISOString());

    if (error) throw error;

    // Group by date
    const grouped = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      grouped.set(date.toISOString().split('T')[0], 0);
    }

    for (const row of data || []) {
      const date = row.timestamp.split('T')[0];
      if (grouped.has(date)) {
        grouped.set(date, (grouped.get(date) || 0) + row.quantity);
      }
    }

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class QuotaExceededError extends Error {
  public upgradeMessage?: string;

  constructor(message: string, upgradeMessage?: string) {
    super(message);
    this.name = 'QuotaExceededError';
    this.upgradeMessage = upgradeMessage;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateQuotaStatus(used: number, limit: number): QuotaStatus {
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
  const percentUsed = isUnlimited ? 0 : (used / limit) * 100;

  return {
    limit,
    used,
    remaining,
    percentUsed: Math.min(100, percentUsed),
    isUnlimited,
    isExceeded: !isUnlimited && used >= limit,
  };
}

function transformCurrentUsage(row: Record<string, unknown>): CurrentUsage {
  return {
    proposalsThisMonth: row.proposals_this_month as number,
    aiCallsThisMonth: row.ai_calls_this_month as number,
    emailsThisMonth: row.emails_this_month as number,
    storageUsedBytes: row.storage_used_bytes as number,
    teamMembersCount: row.team_members_count as number,
    periodStart: row.period_start as string,
  };
}

function transformUsageEvent(row: Record<string, unknown>): UsageEvent {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    userId: row.user_id as string | null,
    eventType: row.event_type as UsageEventType,
    quantity: row.quantity as number,
    metadata: row.metadata as Record<string, unknown>,
    timestamp: row.timestamp as string,
  };
}

function transformUsageRollup(row: Record<string, unknown>): UsageRollup {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    periodType: row.period_type as 'daily' | 'monthly',
    periodStart: row.period_start as string,
    eventType: row.event_type as UsageEventType,
    totalQuantity: row.total_quantity as number,
    metadata: row.metadata as Record<string, unknown>,
  };
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ============================================================================
// EXPORT
// ============================================================================

export default usageService;
