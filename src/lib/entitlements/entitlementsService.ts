/**
 * Sommer's Proposal System - Entitlements Service
 * Phase 29: Feature flags, plan management, and access control
 */

import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, boolean>;
  limits: PlanLimits;
  isActive: boolean;
  sortOrder: number;
}

export interface PlanLimits {
  proposalsPerMonth: number;
  clients: number;
  teamMembers: number;
  storageMb: number;
  aiCallsPerMonth: number;
  industries: number;
}

export interface OrgEntitlement {
  id: string;
  orgId: string;
  planOverride: string | null;
  isComped: boolean;
  compedUntil: string | null;
  reason: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  orgId: string;
  featureKey: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export type FeatureKey =
  | 'proposals'
  | 'clients'
  | 'templates'
  | 'basic_analytics'
  | 'advanced_analytics'
  | 'email_support'
  | 'priority_support'
  | 'dedicated_support'
  | 'custom_branding'
  | 'integrations'
  | 'ai_assistant'
  | 'automation'
  | 'api_access'
  | 'white_label'
  | 'custom_domain'
  | 'sso'
  | 'audit_logs';

// ============================================================================
// PLAN CACHE
// ============================================================================

let plansCache: Plan[] | null = null;
let plansCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// ENTITLEMENTS SERVICE
// ============================================================================

export const entitlementsService = {
  // --------------------------------------------------------------------------
  // Plans
  // --------------------------------------------------------------------------

  /**
   * Get all active plans
   */
  async getPlans(): Promise<Plan[]> {
    // Check cache
    if (plansCache && Date.now() - plansCacheTime < CACHE_TTL) {
      return plansCache;
    }

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    plansCache = (data || []).map(transformPlan);
    plansCacheTime = Date.now();
    return plansCache;
  },

  /**
   * Get a specific plan by ID
   */
  async getPlan(planId: string): Promise<Plan | null> {
    const plans = await this.getPlans();
    return plans.find((p) => p.id === planId) || null;
  },

  // --------------------------------------------------------------------------
  // Effective Plan Resolution
  // --------------------------------------------------------------------------

  /**
   * Get the effective plan for an organization
   * Checks: entitlement override -> Stripe subscription -> default free
   */
  async getEffectivePlan(orgId: string): Promise<Plan> {
    // 1. Check for entitlement override (comped accounts)
    const { data: entitlement } = await supabase
      .from('org_entitlements')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (entitlement?.is_comped) {
      const compedUntil = entitlement.comped_until
        ? new Date(entitlement.comped_until)
        : null;

      // If comped forever or still within comped period
      if (!compedUntil || compedUntil > new Date()) {
        if (entitlement.plan_override) {
          const plan = await this.getPlan(entitlement.plan_override);
          if (plan) return plan;
        }
      }
    }

    // 2. Check Stripe subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single();

    if (subscription?.plan_id) {
      const plan = await this.getPlan(subscription.plan_id);
      if (plan) return plan;
    }

    // 3. Default to free plan
    const freePlan = await this.getPlan('free');
    if (!freePlan) throw new Error('Free plan not found');
    return freePlan;
  },

  /**
   * Check if org is comped
   */
  async isComped(orgId: string): Promise<boolean> {
    const { data } = await supabase
      .from('org_entitlements')
      .select('is_comped, comped_until')
      .eq('org_id', orgId)
      .single();

    if (!data?.is_comped) return false;

    if (data.comped_until) {
      return new Date(data.comped_until) > new Date();
    }

    return true;
  },

  // --------------------------------------------------------------------------
  // Feature Checks
  // --------------------------------------------------------------------------

  /**
   * Check if a feature is enabled for an org
   */
  async hasFeature(orgId: string, feature: FeatureKey): Promise<boolean> {
    // Check for feature flag override first
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('org_id', orgId)
      .eq('feature_key', feature)
      .single();

    if (flag !== null) {
      return flag.enabled;
    }

    // Fall back to plan features
    const plan = await this.getEffectivePlan(orgId);
    return plan.features[feature] ?? false;
  },

  /**
   * Check multiple features at once
   */
  async hasFeatures(
    orgId: string,
    features: FeatureKey[]
  ): Promise<Record<FeatureKey, boolean>> {
    const plan = await this.getEffectivePlan(orgId);

    // Get all flag overrides for this org
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('feature_key, enabled')
      .eq('org_id', orgId)
      .in('feature_key', features);

    const flagMap = new Map(
      (flags || []).map((f) => [f.feature_key, f.enabled])
    );

    const result: Record<string, boolean> = {};
    for (const feature of features) {
      result[feature] = flagMap.has(feature)
        ? flagMap.get(feature)!
        : (plan.features[feature] ?? false);
    }

    return result as Record<FeatureKey, boolean>;
  },

  /**
   * Get all features for an org
   */
  async getAllFeatures(orgId: string): Promise<Record<FeatureKey, boolean>> {
    const plan = await this.getEffectivePlan(orgId);

    // Get all flag overrides
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('feature_key, enabled')
      .eq('org_id', orgId);

    const result = { ...plan.features };
    for (const flag of flags || []) {
      result[flag.feature_key] = flag.enabled;
    }

    return result as Record<FeatureKey, boolean>;
  },

  // --------------------------------------------------------------------------
  // Limit Checks
  // --------------------------------------------------------------------------

  /**
   * Get limits for an org
   */
  async getLimits(orgId: string): Promise<PlanLimits> {
    const plan = await this.getEffectivePlan(orgId);
    return plan.limits;
  },

  /**
   * Check if org is within a specific limit
   * Returns true if within limit, false if exceeded
   */
  async checkLimit(
    orgId: string,
    limitKey: keyof PlanLimits,
    currentValue: number
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    const limits = await this.getLimits(orgId);
    const limit = limits[limitKey];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, limit: -1, current: currentValue };
    }

    return {
      allowed: currentValue < limit,
      limit,
      current: currentValue,
    };
  },

  // --------------------------------------------------------------------------
  // Feature Flags Management (Admin)
  // --------------------------------------------------------------------------

  /**
   * Set a feature flag for an org
   */
  async setFeatureFlag(
    orgId: string,
    featureKey: string,
    enabled: boolean,
    config?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.from('feature_flags').upsert(
      {
        org_id: orgId,
        feature_key: featureKey,
        enabled,
        config: config || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,feature_key' }
    );

    if (error) throw error;
  },

  /**
   * Remove a feature flag override
   */
  async removeFeatureFlag(orgId: string, featureKey: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('org_id', orgId)
      .eq('feature_key', featureKey);

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Entitlements Management (Admin)
  // --------------------------------------------------------------------------

  /**
   * Set entitlement override for an org (comp account)
   */
  async setEntitlement(
    orgId: string,
    entitlement: {
      planOverride?: string;
      isComped?: boolean;
      compedUntil?: string | null;
      reason?: string;
      notes?: string;
      createdBy?: string;
    }
  ): Promise<OrgEntitlement> {
    const { data, error } = await supabase
      .from('org_entitlements')
      .upsert(
        {
          org_id: orgId,
          plan_override: entitlement.planOverride,
          is_comped: entitlement.isComped ?? false,
          comped_until: entitlement.compedUntil,
          reason: entitlement.reason,
          notes: entitlement.notes,
          created_by: entitlement.createdBy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return transformEntitlement(data);
  },

  /**
   * Get entitlement for an org
   */
  async getEntitlement(orgId: string): Promise<OrgEntitlement | null> {
    const { data, error } = await supabase
      .from('org_entitlements')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformEntitlement(data) : null;
  },

  /**
   * Remove entitlement override
   */
  async removeEntitlement(orgId: string): Promise<void> {
    const { error } = await supabase
      .from('org_entitlements')
      .delete()
      .eq('org_id', orgId);

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Plan Comparison Helpers
  // --------------------------------------------------------------------------

  /**
   * Get upgrade options for current plan
   */
  async getUpgradeOptions(currentPlanId: string): Promise<Plan[]> {
    const plans = await this.getPlans();
    const currentPlan = plans.find((p) => p.id === currentPlanId);
    if (!currentPlan) return [];

    return plans.filter((p) => p.sortOrder > currentPlan.sortOrder);
  },

  /**
   * Compare two plans
   */
  async comparePlans(
    planId1: string,
    planId2: string
  ): Promise<{
    plan1: Plan;
    plan2: Plan;
    featureDiff: { feature: string; plan1: boolean; plan2: boolean }[];
    limitDiff: { limit: string; plan1: number; plan2: number }[];
  }> {
    const [plan1, plan2] = await Promise.all([
      this.getPlan(planId1),
      this.getPlan(planId2),
    ]);

    if (!plan1 || !plan2) throw new Error('Plan not found');

    const allFeatures = new Set([
      ...Object.keys(plan1.features),
      ...Object.keys(plan2.features),
    ]);

    const featureDiff = Array.from(allFeatures).map((feature) => ({
      feature,
      plan1: plan1.features[feature] ?? false,
      plan2: plan2.features[feature] ?? false,
    }));

    const allLimits = new Set([
      ...Object.keys(plan1.limits),
      ...Object.keys(plan2.limits),
    ]) as Set<keyof PlanLimits>;

    const limitDiff = Array.from(allLimits).map((limit) => ({
      limit,
      plan1: plan1.limits[limit] ?? 0,
      plan2: plan2.limits[limit] ?? 0,
    }));

    return { plan1, plan2, featureDiff, limitDiff };
  },
};

// ============================================================================
// TRANSFORMERS
// ============================================================================

function transformPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    description: row.description as string,
    priceMonthly: row.price_monthly as number,
    priceYearly: row.price_yearly as number,
    features: row.features as Record<string, boolean>,
    limits: row.limits as PlanLimits,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
  };
}

function transformEntitlement(row: Record<string, unknown>): OrgEntitlement {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    planOverride: row.plan_override as string | null,
    isComped: row.is_comped as boolean,
    compedUntil: row.comped_until as string | null,
    reason: row.reason as string | null,
    notes: row.notes as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default entitlementsService;
