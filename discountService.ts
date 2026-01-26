/**
 * Sommer's Proposal System - Discount Service
 * Complete business logic for all discount features
 */

import { supabase } from '@/lib/supabase';
import type {
  DiscountCode,
  DiscountCodeUsage,
  ValidateCodeResult,
  CreateDiscountCodeInput,
  AutoDiscountRule,
  CreateAutoRuleInput,
  LoyaltyProgram,
  CustomerLoyalty,
  LoyaltyTransaction,
  EarnPointsInput,
  RedeemPointsInput,
  VolumeDiscountTier,
  VolumeDiscountResult,
  CalculateVolumeDiscountInput,
  SeasonalDiscount,
  ActiveSeasonalDiscount,
  CreateSeasonalDiscountInput,
  DiscountApprovalSettings,
  DiscountApprovalRequest,
  CreateApprovalRequestInput,
  ReviewApprovalInput,
  DiscountContext,
  DiscountCalculationResult,
  AvailableDiscount,
  AppliedDiscount,
  DiscountUpsell,
  ApprovalStatus,
} from './discountTypes';

// ============================================================================
// 1. DISCOUNT CODES SERVICE
// ============================================================================

export const discountCodesService = {
  /**
   * Create a new discount code
   */
  async create(orgId: string, input: CreateDiscountCodeInput): Promise<DiscountCode> {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase().trim(),
        name: input.name,
        description: input.description,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        max_discount_amount: input.maxDiscountAmount,
        min_order_amount: input.minOrderAmount || 0,
        max_uses_total: input.maxUsesTotal,
        max_uses_per_customer: input.maxUsesPerCustomer || 1,
        applicable_services: input.applicableServices,
        applicable_tiers: input.applicableTiers,
        new_customers_only: input.newCustomersOnly || false,
        existing_customers_only: input.existingCustomersOnly || false,
        specific_customer_ids: input.specificCustomerIds,
        starts_at: input.startsAt || new Date().toISOString(),
        expires_at: input.expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDiscountCode(data);
  },

  /**
   * Get all discount codes for an organization
   */
  async list(orgId: string, includeInactive = false): Promise<DiscountCode[]> {
    let query = supabase
      .from('discount_codes')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapDiscountCode);
  },

  /**
   * Validate and get discount for a code
   */
  async validate(
    orgId: string,
    code: string,
    clientId: string | undefined,
    clientEmail: string | undefined,
    orderAmount: number
  ): Promise<ValidateCodeResult> {
    // Find the code
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('org_id', orgId)
      .ilike('code', code.trim())
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .single();

    if (error || !discountCode) {
      return { valid: false, error: 'Invalid or expired discount code' };
    }

    // Check expiration
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return { valid: false, error: 'This discount code has expired' };
    }

    // Check max total uses
    if (discountCode.max_uses_total && discountCode.times_used >= discountCode.max_uses_total) {
      return { valid: false, error: 'This discount code has reached its usage limit' };
    }

    // Check per-customer usage
    if (clientId || clientEmail) {
      const { count } = await supabase
        .from('discount_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code_id', discountCode.id)
        .or(`client_id.eq.${clientId},client_email.eq.${clientEmail}`);

      if (discountCode.max_uses_per_customer && (count || 0) >= discountCode.max_uses_per_customer) {
        return { valid: false, error: 'You have already used this discount code' };
      }
    }

    // Check minimum order
    if (orderAmount < discountCode.min_order_amount) {
      return {
        valid: false,
        error: `Minimum order of $${discountCode.min_order_amount.toFixed(2)} required`,
      };
    }

    // Calculate discount amount
    let discountAmount: number;
    if (discountCode.discount_type === 'percent') {
      discountAmount = orderAmount * (discountCode.discount_value / 100);
      if (discountCode.max_discount_amount) {
        discountAmount = Math.min(discountAmount, discountCode.max_discount_amount);
      }
    } else {
      discountAmount = Math.min(discountCode.discount_value, orderAmount);
    }

    return {
      valid: true,
      discountCodeId: discountCode.id,
      code: discountCode.code,
      name: discountCode.name,
      discountType: discountCode.discount_type,
      discountValue: discountCode.discount_value,
      discountAmount,
      description: discountCode.description,
    };
  },

  /**
   * Record usage of a discount code
   */
  async recordUsage(
    orgId: string,
    discountCodeId: string,
    proposalId: string,
    clientId: string | undefined,
    clientEmail: string | undefined,
    orderAmount: number,
    discountAmount: number,
    appliedBy: string
  ): Promise<void> {
    // Record usage
    await supabase.from('discount_code_usage').insert({
      org_id: orgId,
      discount_code_id: discountCodeId,
      proposal_id: proposalId,
      client_id: clientId,
      client_email: clientEmail,
      order_amount: orderAmount,
      discount_amount: discountAmount,
      applied_by: appliedBy,
    });

    // Update code stats
    await supabase.rpc('increment_discount_code_usage', {
      p_code_id: discountCodeId,
      p_discount_amount: discountAmount,
    });
  },

  /**
   * Update a discount code
   */
  async update(id: string, updates: Partial<CreateDiscountCodeInput>): Promise<DiscountCode> {
    const { data, error } = await supabase
      .from('discount_codes')
      .update({
        ...updates,
        code: updates.code?.toUpperCase().trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapDiscountCode(data);
  },

  /**
   * Deactivate a discount code
   */
  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get usage history for a discount code
   */
  async getUsageHistory(discountCodeId: string): Promise<DiscountCodeUsage[]> {
    const { data, error } = await supabase
      .from('discount_code_usage')
      .select('*')
      .eq('discount_code_id', discountCodeId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data.map(mapDiscountCodeUsage);
  },
};

// ============================================================================
// 2. AUTOMATIC DISCOUNT RULES SERVICE
// ============================================================================

export const autoDiscountService = {
  /**
   * Create a new automatic discount rule
   */
  async create(orgId: string, input: CreateAutoRuleInput): Promise<AutoDiscountRule> {
    const { data, error } = await supabase
      .from('automatic_discount_rules')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        priority: input.priority || 0,
        rule_type: input.ruleType,
        conditions: input.conditions,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        max_discount_amount: input.maxDiscountAmount,
        stackable: input.stackable || false,
        stack_with_codes: input.stackWithCodes ?? true,
        starts_at: input.startsAt,
        expires_at: input.expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapAutoRule(data);
  },

  /**
   * Get all automatic discount rules
   */
  async list(orgId: string, activeOnly = true): Promise<AutoDiscountRule[]> {
    let query = supabase
      .from('automatic_discount_rules')
      .select('*')
      .eq('org_id', orgId)
      .order('priority', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapAutoRule);
  },

  /**
   * Evaluate which rules apply to a context
   */
  async evaluate(context: DiscountContext): Promise<AvailableDiscount[]> {
    const rules = await this.list(context.orgId);
    const now = new Date();
    const applicableDiscounts: AvailableDiscount[] = [];

    for (const rule of rules) {
      // Check validity period
      if (rule.startsAt && new Date(rule.startsAt) > now) continue;
      if (rule.expiresAt && new Date(rule.expiresAt) < now) continue;

      // Evaluate conditions
      const applies = evaluateRuleConditions(rule, context);

      if (applies) {
        const estimatedSavings = calculateDiscount(
          rule.discountType,
          rule.discountValue,
          context.subtotal,
          rule.maxDiscountAmount
        );

        applicableDiscounts.push({
          source: 'automatic_rule',
          sourceId: rule.id,
          name: rule.name,
          description: rule.description,
          discountType: rule.discountType,
          discountValue: rule.discountValue,
          estimatedSavings,
          canApply: true,
          stackable: rule.stackable,
          priority: rule.priority,
        });
      }
    }

    return applicableDiscounts.sort((a, b) => b.priority - a.priority);
  },

  /**
   * Record that a rule was applied
   */
  async recordApplication(ruleId: string, discountAmount: number): Promise<void> {
    await supabase.rpc('increment_auto_rule_usage', {
      p_rule_id: ruleId,
      p_discount_amount: discountAmount,
    });
  },
};

// ============================================================================
// 3. LOYALTY PROGRAM SERVICE
// ============================================================================

export const loyaltyService = {
  /**
   * Get or create loyalty program for org
   */
  async getProgram(orgId: string): Promise<LoyaltyProgram | null> {
    const { data, error } = await supabase
      .from('loyalty_program')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapLoyaltyProgram(data) : null;
  },

  /**
   * Update loyalty program settings
   */
  async updateProgram(orgId: string, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const { data, error } = await supabase
      .from('loyalty_program')
      .upsert({
        org_id: orgId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return mapLoyaltyProgram(data);
  },

  /**
   * Get customer loyalty data
   */
  async getCustomerLoyalty(orgId: string, clientId: string): Promise<CustomerLoyalty | null> {
    const { data, error } = await supabase
      .from('customer_loyalty')
      .select('*')
      .eq('org_id', orgId)
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapCustomerLoyalty(data) : null;
  },

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(orgId: string, clientId: string, referredBy?: string): Promise<CustomerLoyalty> {
    const program = await this.getProgram(orgId);
    const referralCode = generateReferralCode();

    const { data, error } = await supabase
      .from('customer_loyalty')
      .insert({
        org_id: orgId,
        client_id: clientId,
        referred_by: referredBy,
        referral_code: referralCode,
        current_points: program?.pointsForSignup || 0,
        total_points_earned: program?.pointsForSignup || 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Record signup bonus transaction
    if (program?.pointsForSignup) {
      await this.recordTransaction(orgId, data.id, {
        type: 'earn_signup',
        points: program.pointsForSignup,
        balanceAfter: program.pointsForSignup,
        description: 'Signup bonus',
      });
    }

    // Award referral bonus if applicable
    if (referredBy && program?.pointsForReferral) {
      const referrer = await supabase
        .from('customer_loyalty')
        .select('id, current_points')
        .eq('referral_code', referredBy)
        .single();

      if (referrer.data) {
        const newBalance = referrer.data.current_points + program.pointsForReferral;
        await supabase
          .from('customer_loyalty')
          .update({
            current_points: newBalance,
            total_points_earned: supabase.rpc('increment', { x: program.pointsForReferral }),
            referrals_count: supabase.rpc('increment', { x: 1 }),
          })
          .eq('id', referrer.data.id);

        await this.recordTransaction(orgId, referrer.data.id, {
          type: 'earn_referral',
          points: program.pointsForReferral,
          balanceAfter: newBalance,
          description: 'Referral bonus',
        });
      }
    }

    return mapCustomerLoyalty(data);
  },

  /**
   * Earn points from a purchase
   */
  async earnPoints(orgId: string, input: EarnPointsInput): Promise<LoyaltyTransaction> {
    const program = await this.getProgram(orgId);
    if (!program || !program.isActive) {
      throw new Error('Loyalty program is not active');
    }

    let loyalty = await this.getCustomerLoyalty(orgId, input.clientId);
    if (!loyalty) {
      loyalty = await this.enrollCustomer(orgId, input.clientId);
    }

    // Calculate points
    const basePoints = Math.floor(input.orderAmount * program.pointsPerDollar);
    const totalPoints = basePoints + (input.bonusPoints || 0);
    const newBalance = loyalty.currentPoints + totalPoints;

    // Update customer loyalty
    const { error } = await supabase
      .from('customer_loyalty')
      .update({
        current_points: newBalance,
        total_points_earned: loyalty.totalPointsEarned + totalPoints,
        total_orders: loyalty.totalOrders + 1,
        total_spent: loyalty.totalSpent + input.orderAmount,
        last_order_date: new Date().toISOString(),
        first_order_date: loyalty.firstOrderDate || new Date().toISOString(),
      })
      .eq('id', loyalty.id);

    if (error) throw error;

    // Update tier
    await this.updateCustomerTier(orgId, loyalty.id);

    // Record transaction
    return this.recordTransaction(orgId, loyalty.id, {
      type: 'earn_purchase',
      points: totalPoints,
      balanceAfter: newBalance,
      proposalId: input.proposalId,
      description: `Earned ${basePoints} points from $${input.orderAmount.toFixed(2)} purchase${
        input.bonusPoints ? ` + ${input.bonusPoints} bonus points` : ''
      }`,
    });
  },

  /**
   * Redeem points for discount
   */
  async redeemPoints(orgId: string, input: RedeemPointsInput): Promise<{ discountAmount: number; transaction: LoyaltyTransaction }> {
    const program = await this.getProgram(orgId);
    if (!program || !program.isActive) {
      throw new Error('Loyalty program is not active');
    }

    const loyalty = await this.getCustomerLoyalty(orgId, input.clientId);
    if (!loyalty) {
      throw new Error('Customer is not enrolled in loyalty program');
    }

    if (input.points < program.minPointsToRedeem) {
      throw new Error(`Minimum ${program.minPointsToRedeem} points required to redeem`);
    }

    if (input.points > loyalty.currentPoints) {
      throw new Error('Insufficient points');
    }

    // Calculate discount amount
    const discountAmount = input.points * program.pointsToDollarRatio;
    const newBalance = loyalty.currentPoints - input.points;

    // Update customer loyalty
    await supabase
      .from('customer_loyalty')
      .update({
        current_points: newBalance,
        total_points_redeemed: loyalty.totalPointsRedeemed + input.points,
      })
      .eq('id', loyalty.id);

    // Record transaction
    const transaction = await this.recordTransaction(orgId, loyalty.id, {
      type: 'redeem',
      points: -input.points,
      balanceAfter: newBalance,
      proposalId: input.proposalId,
      description: `Redeemed ${input.points} points for $${discountAmount.toFixed(2)} discount`,
    });

    return { discountAmount, transaction };
  },

  /**
   * Get customer's transaction history
   */
  async getTransactionHistory(customerLoyaltyId: string, limit = 50): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_loyalty_id', customerLoyaltyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(mapLoyaltyTransaction);
  },

  /**
   * Update customer's tier based on points
   */
  async updateCustomerTier(orgId: string, loyaltyId: string): Promise<void> {
    const program = await this.getProgram(orgId);
    if (!program) return;

    const { data: loyalty } = await supabase
      .from('customer_loyalty')
      .select('total_points_earned')
      .eq('id', loyaltyId)
      .single();

    if (!loyalty) return;

    // Find highest qualifying tier
    let currentTier = program.tiers[0];
    for (const tier of program.tiers) {
      if (loyalty.total_points_earned >= tier.minPoints) {
        currentTier = tier;
      }
    }

    await supabase
      .from('customer_loyalty')
      .update({
        current_tier: currentTier.name,
        tier_discount_percent: currentTier.discountPercent,
      })
      .eq('id', loyaltyId);
  },

  /**
   * Record a loyalty transaction
   */
  async recordTransaction(
    orgId: string,
    customerLoyaltyId: string,
    data: Omit<LoyaltyTransaction, 'id' | 'orgId' | 'customerLoyaltyId' | 'createdAt'>
  ): Promise<LoyaltyTransaction> {
    const { data: transaction, error } = await supabase
      .from('loyalty_transactions')
      .insert({
        org_id: orgId,
        customer_loyalty_id: customerLoyaltyId,
        type: data.type,
        points: data.points,
        balance_after: data.balanceAfter,
        proposal_id: data.proposalId,
        description: data.description,
      })
      .select()
      .single();

    if (error) throw error;
    return mapLoyaltyTransaction(transaction);
  },
};

// ============================================================================
// 4. VOLUME DISCOUNT SERVICE
// ============================================================================

export const volumeDiscountService = {
  /**
   * Get volume discount tiers for org
   */
  async list(orgId: string): Promise<VolumeDiscountTier[]> {
    const { data, error } = await supabase
      .from('volume_discount_tiers')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data.map(mapVolumeTier);
  },

  /**
   * Calculate volume discount for given parameters
   */
  async calculate(orgId: string, input: CalculateVolumeDiscountInput): Promise<VolumeDiscountResult | null> {
    const tiers = await this.list(orgId);
    
    // Find matching tier configuration
    const tierConfig = tiers.find(
      (t) =>
        t.measurementType === input.measurementType &&
        (!t.serviceType || t.serviceType === input.serviceType)
    );

    if (!tierConfig) return null;

    // Find applicable tier level
    let applicableTier = tierConfig.tiers[0];
    let nextTier: VolumeDiscountResult['nextTier'] | undefined;

    for (let i = 0; i < tierConfig.tiers.length; i++) {
      const tier = tierConfig.tiers[i];
      if (input.value >= tier.min && (!tier.max || input.value <= tier.max)) {
        applicableTier = tier;
        
        // Check for next tier
        if (i < tierConfig.tiers.length - 1) {
          const next = tierConfig.tiers[i + 1];
          nextTier = {
            level: next,
            amountToReach: next.min - input.value,
            additionalSavings: next.discountPercent - tier.discountPercent,
          };
        }
      }
    }

    // Calculate discount amount (assuming input.value is the subtotal for amount-based)
    const discountAmount =
      input.measurementType === 'total_amount'
        ? input.value * (applicableTier.discountPercent / 100)
        : 0; // For sqft-based, caller needs to apply to their subtotal

    return {
      tierId: tierConfig.id,
      tierName: tierConfig.name,
      tierLevel: applicableTier,
      discountPercent: applicableTier.discountPercent,
      discountAmount,
      nextTier,
    };
  },

  /**
   * Create volume discount tier configuration
   */
  async create(orgId: string, input: Omit<VolumeDiscountTier, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<VolumeDiscountTier> {
    const { data, error } = await supabase
      .from('volume_discount_tiers')
      .insert({
        org_id: orgId,
        ...input,
      })
      .select()
      .single();

    if (error) throw error;
    return mapVolumeTier(data);
  },
};

// ============================================================================
// 5. SEASONAL DISCOUNT SERVICE
// ============================================================================

export const seasonalDiscountService = {
  /**
   * Get all seasonal discounts
   */
  async list(orgId: string, activeOnly = true): Promise<SeasonalDiscount[]> {
    let query = supabase
      .from('seasonal_discounts')
      .select('*')
      .eq('org_id', orgId)
      .order('starts_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapSeasonalDiscount);
  },

  /**
   * Get currently active seasonal discounts
   */
  async getActive(orgId: string): Promise<ActiveSeasonalDiscount[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('seasonal_discounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('expires_at', now);

    if (error) throw error;

    return data.map((d) => {
      const discount = mapSeasonalDiscount(d);
      const expiresAt = new Date(discount.expiresAt);
      const nowDate = new Date();
      const diff = expiresAt.getTime() - nowDate.getTime();

      const timeRemaining = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      };

      return {
        ...discount,
        timeRemaining,
        isExpiringSoon: diff < 48 * 60 * 60 * 1000, // < 48 hours
      };
    });
  },

  /**
   * Create a seasonal discount campaign
   */
  async create(orgId: string, input: CreateSeasonalDiscountInput, createdBy: string): Promise<SeasonalDiscount> {
    const { data, error } = await supabase
      .from('seasonal_discounts')
      .insert({
        org_id: orgId,
        ...input,
        created_by: createdBy,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSeasonalDiscount(data);
  },

  /**
   * Record a view of seasonal discount
   */
  async recordView(discountId: string): Promise<void> {
    await supabase.rpc('increment_seasonal_views', { p_discount_id: discountId });
  },

  /**
   * Record application of seasonal discount
   */
  async recordApplication(discountId: string, discountAmount: number): Promise<void> {
    await supabase.rpc('increment_seasonal_usage', {
      p_discount_id: discountId,
      p_discount_amount: discountAmount,
    });
  },
};

// ============================================================================
// 6. DISCOUNT APPROVAL SERVICE
// ============================================================================

export const discountApprovalService = {
  /**
   * Get approval settings for org
   */
  async getSettings(orgId: string): Promise<DiscountApprovalSettings | null> {
    const { data, error } = await supabase
      .from('discount_approval_settings')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapApprovalSettings(data) : null;
  },

  /**
   * Update approval settings
   */
  async updateSettings(orgId: string, updates: Partial<DiscountApprovalSettings>): Promise<DiscountApprovalSettings> {
    const { data, error } = await supabase
      .from('discount_approval_settings')
      .upsert({
        org_id: orgId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return mapApprovalSettings(data);
  },

  /**
   * Check if discount requires approval
   */
  async checkApprovalRequired(
    orgId: string,
    discountPercent: number,
    discountAmount: number,
    orderTotal: number,
    userRole: string
  ): Promise<{ required: boolean; reason?: string }> {
    const settings = await this.getSettings(orgId);
    if (!settings || !settings.requireApproval) {
      return { required: false };
    }

    // Check role limits
    const roleLimit = settings.roleLimits[userRole];
    if (roleLimit) {
      if (discountPercent > roleLimit.maxPercent) {
        return {
          required: true,
          reason: `Discount of ${discountPercent}% exceeds your limit of ${roleLimit.maxPercent}%`,
        };
      }
      if (roleLimit.maxAmount !== null && discountAmount > roleLimit.maxAmount) {
        return {
          required: true,
          reason: `Discount of $${discountAmount.toFixed(2)} exceeds your limit of $${roleLimit.maxAmount.toFixed(2)}`,
        };
      }
    }

    // Check global thresholds
    if (discountPercent > settings.approvalThresholdPercent) {
      return {
        required: true,
        reason: `Discount of ${discountPercent}% exceeds threshold of ${settings.approvalThresholdPercent}%`,
      };
    }

    if (discountAmount > settings.approvalThresholdAmount) {
      return {
        required: true,
        reason: `Discount of $${discountAmount.toFixed(2)} exceeds threshold of $${settings.approvalThresholdAmount.toFixed(2)}`,
      };
    }

    if (settings.approvalForOrdersOver && orderTotal > settings.approvalForOrdersOver) {
      return {
        required: true,
        reason: `Order total of $${orderTotal.toFixed(2)} exceeds threshold for automatic discount approval`,
      };
    }

    return { required: false };
  },

  /**
   * Create approval request
   */
  async createRequest(orgId: string, input: CreateApprovalRequestInput, requestedBy: string): Promise<DiscountApprovalRequest> {
    // Get proposal details
    const { data: proposal } = await supabase
      .from('proposals')
      .select('proposal_number, pricing_data, contact_id, contacts(name)')
      .eq('id', input.proposalId)
      .single();

    const proposalTotal = proposal?.pricing_data?.total || 0;
    const discountAmount = calculateDiscount(input.discountType, input.discountValue, proposalTotal);

    // Get client info
    let clientLifetimeValue: number | undefined;
    let isRepeatCustomer = false;
    if (proposal?.contact_id) {
      const { data: clientStats } = await supabase
        .from('proposals')
        .select('id')
        .eq('contact_id', proposal.contact_id)
        .eq('status', 'signed');
      
      isRepeatCustomer = (clientStats?.length || 0) > 0;
      
      const { data: ltv } = await supabase
        .from('proposals')
        .select('pricing_data')
        .eq('contact_id', proposal.contact_id)
        .eq('status', 'signed');
      
      clientLifetimeValue = ltv?.reduce((sum, p) => sum + (p.pricing_data?.total || 0), 0);
    }

    const { data, error } = await supabase
      .from('discount_approval_requests')
      .insert({
        org_id: orgId,
        proposal_id: input.proposalId,
        proposal_number: proposal?.proposal_number,
        proposal_total: proposalTotal,
        requested_by: requestedBy,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        discount_amount: discountAmount,
        discount_percent_of_total: (discountAmount / proposalTotal) * 100,
        reason: input.reason,
        supporting_notes: input.supportingNotes,
        client_name: proposal?.contacts?.name,
        client_id: proposal?.contact_id,
        is_repeat_customer: isRepeatCustomer,
        client_lifetime_value: clientLifetimeValue,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to approvers
    // TODO: Implement notification service call

    return mapApprovalRequest(data);
  },

  /**
   * Get pending approval requests
   */
  async getPendingRequests(orgId: string): Promise<DiscountApprovalRequest[]> {
    const { data, error } = await supabase
      .from('discount_approval_requests')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw error;
    return data.map(mapApprovalRequest);
  },

  /**
   * Review (approve/reject) a request
   */
  async review(input: ReviewApprovalInput, reviewedBy: string): Promise<DiscountApprovalRequest> {
    const updates: Record<string, unknown> = {
      status: input.action === 'counter' ? 'approved' : input.action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: input.notes,
    };

    if (input.action === 'counter') {
      updates.counter_discount_type = input.counterDiscountType;
      updates.counter_discount_value = input.counterDiscountValue;
    }

    const { data, error } = await supabase
      .from('discount_approval_requests')
      .update(updates)
      .eq('id', input.requestId)
      .select()
      .single();

    if (error) throw error;

    // Send notification to requester
    // TODO: Implement notification service call

    return mapApprovalRequest(data);
  },
};

// ============================================================================
// DISCOUNT ENGINE - MAIN CALCULATION
// ============================================================================

export const discountEngine = {
  /**
   * Calculate all applicable discounts for a context
   */
  async calculate(context: DiscountContext): Promise<DiscountCalculationResult> {
    const availableDiscounts: AvailableDiscount[] = [];
    const appliedDiscounts: AppliedDiscount[] = [];
    let totalDiscount = 0;
    let currentSubtotal = context.subtotal;
    let requiresApproval = false;
    let approvalReason: string | undefined;

    // 1. Check for active seasonal discounts
    const seasonalDiscounts = await seasonalDiscountService.getActive(context.orgId);
    for (const seasonal of seasonalDiscounts) {
      if (seasonal.minOrderAmount && context.subtotal < seasonal.minOrderAmount) continue;
      
      const savings = calculateDiscount(
        seasonal.discountType,
        seasonal.discountValue,
        context.subtotal,
        seasonal.maxDiscountAmount
      );

      availableDiscounts.push({
        source: 'seasonal',
        sourceId: seasonal.id,
        name: seasonal.name,
        description: seasonal.bannerText || seasonal.description,
        discountType: seasonal.discountType,
        discountValue: seasonal.discountValue,
        estimatedSavings: savings,
        canApply: true,
        stackable: false,
        priority: 100,
      });
    }

    // 2. Check automatic discount rules
    const autoDiscounts = await autoDiscountService.evaluate(context);
    availableDiscounts.push(...autoDiscounts);

    // 3. Check volume discounts
    const totalSqft = context.services.reduce((sum, s) => (s.unit === 'sqft' ? sum + s.quantity : sum), 0);
    if (totalSqft > 0) {
      const volumeResult = await volumeDiscountService.calculate(context.orgId, {
        measurementType: 'total_sqft',
        value: totalSqft,
      });

      if (volumeResult && volumeResult.discountPercent > 0) {
        const savings = context.subtotal * (volumeResult.discountPercent / 100);
        availableDiscounts.push({
          source: 'volume',
          sourceId: volumeResult.tierId,
          name: `${volumeResult.tierLevel.label || 'Volume'} Discount`,
          description: `${volumeResult.discountPercent}% off for ${totalSqft.toLocaleString()} sq ft`,
          discountType: 'percent',
          discountValue: volumeResult.discountPercent,
          estimatedSavings: savings,
          canApply: true,
          stackable: false,
          priority: 80,
        });
      }
    }

    // 4. Check loyalty discount
    if (context.clientId) {
      const loyalty = await loyaltyService.getCustomerLoyalty(context.orgId, context.clientId);
      if (loyalty && loyalty.tierDiscountPercent > 0) {
        const savings = context.subtotal * (loyalty.tierDiscountPercent / 100);
        availableDiscounts.push({
          source: 'loyalty',
          sourceId: loyalty.id,
          name: `${loyalty.currentTier} Member Discount`,
          description: `${loyalty.tierDiscountPercent}% loyalty discount`,
          discountType: 'percent',
          discountValue: loyalty.tierDiscountPercent,
          estimatedSavings: savings,
          canApply: true,
          stackable: true,
          priority: 50,
        });
      }
    }

    // 5. Validate promo code if provided
    if (context.promoCode) {
      const codeResult = await discountCodesService.validate(
        context.orgId,
        context.promoCode,
        context.clientId,
        context.clientEmail,
        context.subtotal
      );

      if (codeResult.valid) {
        availableDiscounts.push({
          source: 'promo_code',
          sourceId: codeResult.discountCodeId!,
          name: codeResult.name!,
          description: codeResult.description,
          discountType: codeResult.discountType!,
          discountValue: codeResult.discountValue!,
          estimatedSavings: codeResult.discountAmount!,
          canApply: true,
          stackable: true,
          priority: 90,
        });
      }
    }

    // 6. Apply best non-stackable discount OR all stackable discounts
    const nonStackable = availableDiscounts
      .filter((d) => !d.stackable && d.canApply)
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    const stackable = availableDiscounts
      .filter((d) => d.stackable && d.canApply)
      .sort((a, b) => b.priority - a.priority);

    // Determine best approach: best non-stackable OR sum of stackable
    const bestNonStackable = nonStackable[0];
    const stackableTotal = stackable.reduce((sum, d) => sum + d.estimatedSavings, 0);

    if (bestNonStackable && bestNonStackable.estimatedSavings > stackableTotal) {
      // Use best non-stackable
      const discountAmount = calculateDiscount(
        bestNonStackable.discountType,
        bestNonStackable.discountValue,
        currentSubtotal
      );
      
      appliedDiscounts.push({
        id: crypto.randomUUID(),
        sourceType: bestNonStackable.source,
        sourceId: bestNonStackable.sourceId,
        sourceName: bestNonStackable.name,
        discountType: bestNonStackable.discountType,
        discountValue: bestNonStackable.discountValue,
        discountAmount,
        orderPosition: 1,
        appliedToSubtotal: currentSubtotal,
        requiresApproval: false,
        appliedAt: new Date().toISOString(),
      });
      
      totalDiscount += discountAmount;
      currentSubtotal -= discountAmount;
    } else {
      // Apply all stackable discounts
      let position = 1;
      for (const discount of stackable) {
        const discountAmount = calculateDiscount(
          discount.discountType,
          discount.discountValue,
          currentSubtotal
        );

        appliedDiscounts.push({
          id: crypto.randomUUID(),
          sourceType: discount.source,
          sourceId: discount.sourceId,
          sourceName: discount.name,
          discountType: discount.discountType,
          discountValue: discount.discountValue,
          discountAmount,
          orderPosition: position++,
          appliedToSubtotal: currentSubtotal,
          requiresApproval: false,
          appliedAt: new Date().toISOString(),
        });

        totalDiscount += discountAmount;
        currentSubtotal -= discountAmount;
      }
    }

    // 7. Apply manual discount if provided
    if (context.manualDiscountPercent || context.manualDiscountAmount) {
      const manualType = context.manualDiscountPercent ? 'percent' : 'fixed';
      const manualValue = context.manualDiscountPercent || context.manualDiscountAmount || 0;
      const manualDiscountAmount = calculateDiscount(manualType, manualValue, currentSubtotal);

      // Check if approval required
      const approvalCheck = await discountApprovalService.checkApprovalRequired(
        context.orgId,
        context.manualDiscountPercent || (manualDiscountAmount / currentSubtotal) * 100,
        manualDiscountAmount,
        context.subtotal,
        context.userRole
      );

      appliedDiscounts.push({
        id: crypto.randomUUID(),
        sourceType: 'manual',
        sourceName: 'Manual Discount',
        discountType: manualType,
        discountValue: manualValue,
        discountAmount: manualDiscountAmount,
        orderPosition: appliedDiscounts.length + 1,
        appliedToSubtotal: currentSubtotal,
        requiresApproval: approvalCheck.required,
        appliedAt: new Date().toISOString(),
      });

      if (approvalCheck.required) {
        requiresApproval = true;
        approvalReason = approvalCheck.reason;
      }

      totalDiscount += manualDiscountAmount;
      currentSubtotal -= manualDiscountAmount;
    }

    // 8. Generate upsell suggestions
    const upsellSuggestions = generateUpsellSuggestions(context, availableDiscounts);

    return {
      availableDiscounts,
      appliedDiscounts,
      originalSubtotal: context.subtotal,
      totalDiscount,
      finalSubtotal: currentSubtotal,
      requiresApproval,
      approvalReason,
      upsellSuggestions,
    };
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDiscount(
  type: 'percent' | 'fixed',
  value: number,
  subtotal: number,
  maxAmount?: number
): number {
  let amount: number;
  if (type === 'percent') {
    amount = subtotal * (value / 100);
    if (maxAmount) {
      amount = Math.min(amount, maxAmount);
    }
  } else {
    amount = Math.min(value, subtotal);
  }
  return Math.round(amount * 100) / 100;
}

function evaluateRuleConditions(rule: AutoDiscountRule, context: DiscountContext): boolean {
  const conditions = rule.conditions as Record<string, unknown>;

  switch (rule.ruleType) {
    case 'order_minimum':
      return context.subtotal >= (conditions.minAmount as number);

    case 'first_order':
      return context.isNewCustomer;

    case 'repeat_customer':
      return !context.isNewCustomer && (context.clientTotalOrders || 0) >= ((conditions.minOrders as number) || 1);

    case 'service_combo': {
      const required = conditions.requiredServices as string[];
      const serviceTypes = context.services.map((s) => s.type);
      const requireAll = conditions.requireAll as boolean;
      if (requireAll) {
        return required.every((r) => serviceTypes.includes(r));
      }
      return required.some((r) => serviceTypes.includes(r));
    }

    case 'service_quantity': {
      const service = context.services.find((s) => s.type === conditions.service);
      return service ? service.quantity >= (conditions.minQuantity as number) : false;
    }

    case 'seasonal': {
      const now = new Date();
      const month = now.getMonth() + 1;
      return month >= (conditions.startMonth as number) && month <= (conditions.endMonth as number);
    }

    case 'day_of_week': {
      const dayOfWeek = new Date().getDay();
      return (conditions.days as number[]).includes(dayOfWeek);
    }

    default:
      return false;
  }
}

function generateUpsellSuggestions(
  context: DiscountContext,
  availableDiscounts: AvailableDiscount[]
): DiscountUpsell[] {
  const suggestions: DiscountUpsell[] = [];

  // Volume upsell
  const volumeDiscount = availableDiscounts.find((d) => d.source === 'volume');
  if (!volumeDiscount) {
    suggestions.push({
      type: 'volume',
      message: 'Add more square footage to unlock volume discounts!',
      actionRequired: 'Increase project size to 5,000+ sq ft',
      potentialSavings: context.subtotal * 0.05,
      ctaText: 'Learn More',
    });
  }

  // Combo upsell
  const serviceTypes = context.services.map((s) => s.type);
  if (serviceTypes.includes('sealcoating') && !serviceTypes.includes('crack_filling')) {
    suggestions.push({
      type: 'combo',
      message: 'Bundle with crack filling for extra savings!',
      actionRequired: 'Add crack filling to your proposal',
      potentialSavings: context.subtotal * 0.1,
      ctaText: 'Add Service',
    });
  }

  // Loyalty upsell
  if (context.isNewCustomer) {
    suggestions.push({
      type: 'loyalty',
      message: 'Join our loyalty program to earn points!',
      actionRequired: 'Enroll in the loyalty program',
      potentialSavings: context.subtotal * 0.05,
      ctaText: 'Join Now',
    });
  }

  return suggestions;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapDiscountCode(data: Record<string, unknown>): DiscountCode {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    code: data.code as string,
    name: data.name as string,
    description: data.description as string | undefined,
    discountType: data.discount_type as 'percent' | 'fixed',
    discountValue: data.discount_value as number,
    maxDiscountAmount: data.max_discount_amount as number | undefined,
    minOrderAmount: data.min_order_amount as number,
    maxUsesTotal: data.max_uses_total as number | undefined,
    maxUsesPerCustomer: data.max_uses_per_customer as number,
    applicableServices: data.applicable_services as string[] | undefined,
    applicableTiers: data.applicable_tiers as ('economy' | 'standard' | 'premium')[] | undefined,
    newCustomersOnly: data.new_customers_only as boolean,
    existingCustomersOnly: data.existing_customers_only as boolean,
    specificCustomerIds: data.specific_customer_ids as string[] | undefined,
    startsAt: data.starts_at as string,
    expiresAt: data.expires_at as string | undefined,
    isActive: data.is_active as boolean,
    timesUsed: data.times_used as number,
    totalDiscountGiven: data.total_discount_given as number,
    createdBy: data.created_by as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapDiscountCodeUsage(data: Record<string, unknown>): DiscountCodeUsage {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    discountCodeId: data.discount_code_id as string,
    proposalId: data.proposal_id as string | undefined,
    clientId: data.client_id as string | undefined,
    clientEmail: data.client_email as string | undefined,
    orderAmount: data.order_amount as number,
    discountAmount: data.discount_amount as number,
    appliedAt: data.applied_at as string,
    appliedBy: data.applied_by as string | undefined,
  };
}

function mapAutoRule(data: Record<string, unknown>): AutoDiscountRule {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    priority: data.priority as number,
    ruleType: data.rule_type as AutoDiscountRule['ruleType'],
    conditions: data.conditions as AutoDiscountRule['conditions'],
    discountType: data.discount_type as 'percent' | 'fixed',
    discountValue: data.discount_value as number,
    maxDiscountAmount: data.max_discount_amount as number | undefined,
    stackable: data.stackable as boolean,
    stackWithCodes: data.stack_with_codes as boolean,
    startsAt: data.starts_at as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    isActive: data.is_active as boolean,
    timesApplied: data.times_applied as number,
    totalDiscountGiven: data.total_discount_given as number,
    createdBy: data.created_by as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapLoyaltyProgram(data: Record<string, unknown>): LoyaltyProgram {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    name: data.name as string,
    isActive: data.is_active as boolean,
    pointsPerDollar: data.points_per_dollar as number,
    pointsForSignup: data.points_for_signup as number,
    pointsForReferral: data.points_for_referral as number,
    pointsToDollarRatio: data.points_to_dollar_ratio as number,
    minPointsToRedeem: data.min_points_to_redeem as number,
    maxRedemptionPercent: data.max_redemption_percent as number,
    tiers: data.tiers as LoyaltyProgram['tiers'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapCustomerLoyalty(data: Record<string, unknown>): CustomerLoyalty {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    clientId: data.client_id as string,
    totalPointsEarned: data.total_points_earned as number,
    totalPointsRedeemed: data.total_points_redeemed as number,
    currentPoints: data.current_points as number,
    totalOrders: data.total_orders as number,
    totalSpent: data.total_spent as number,
    firstOrderDate: data.first_order_date as string | undefined,
    lastOrderDate: data.last_order_date as string | undefined,
    currentTier: data.current_tier as string,
    tierDiscountPercent: data.tier_discount_percent as number,
    referredBy: data.referred_by as string | undefined,
    referralCode: data.referral_code as string,
    referralsCount: data.referrals_count as number,
    enrolledAt: data.enrolled_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapLoyaltyTransaction(data: Record<string, unknown>): LoyaltyTransaction {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    customerLoyaltyId: data.customer_loyalty_id as string,
    type: data.type as LoyaltyTransaction['type'],
    points: data.points as number,
    balanceAfter: data.balance_after as number,
    proposalId: data.proposal_id as string | undefined,
    description: data.description as string | undefined,
    createdAt: data.created_at as string,
    createdBy: data.created_by as string | undefined,
  };
}

function mapVolumeTier(data: Record<string, unknown>): VolumeDiscountTier {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    measurementType: data.measurement_type as VolumeDiscountTier['measurementType'],
    serviceType: data.service_type as string | undefined,
    tiers: data.tiers as VolumeDiscountTier['tiers'],
    stackable: data.stackable as boolean,
    isActive: data.is_active as boolean,
    priority: data.priority as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapSeasonalDiscount(data: Record<string, unknown>): SeasonalDiscount {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    bannerText: data.banner_text as string | undefined,
    bannerColor: data.banner_color as string,
    startsAt: data.starts_at as string,
    expiresAt: data.expires_at as string,
    isRecurring: data.is_recurring as boolean,
    recurrenceType: data.recurrence_type as SeasonalDiscount['recurrenceType'],
    discountType: data.discount_type as 'percent' | 'fixed',
    discountValue: data.discount_value as number,
    maxDiscountAmount: data.max_discount_amount as number | undefined,
    minOrderAmount: data.min_order_amount as number,
    applicableServices: data.applicable_services as string[] | undefined,
    promoCode: data.promo_code as string | undefined,
    showCountdown: data.show_countdown as boolean,
    showBanner: data.show_banner as boolean,
    isActive: data.is_active as boolean,
    views: data.views as number,
    timesApplied: data.times_applied as number,
    totalDiscountGiven: data.total_discount_given as number,
    createdBy: data.created_by as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapApprovalSettings(data: Record<string, unknown>): DiscountApprovalSettings {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    requireApproval: data.require_approval as boolean,
    approvalThresholdPercent: data.approval_threshold_percent as number,
    approvalThresholdAmount: data.approval_threshold_amount as number,
    approvalForOrdersOver: data.approval_for_orders_over as number | undefined,
    roleLimits: data.role_limits as DiscountApprovalSettings['roleLimits'],
    defaultApprovers: data.default_approvers as string[],
    escalationAfterHours: data.escalation_after_hours as number,
    autoRejectAfterHours: data.auto_reject_after_hours as number,
    notifyOnRequest: data.notify_on_request as boolean,
    notifyOnApproval: data.notify_on_approval as boolean,
    notifyOnRejection: data.notify_on_rejection as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapApprovalRequest(data: Record<string, unknown>): DiscountApprovalRequest {
  return {
    id: data.id as string,
    orgId: data.org_id as string,
    proposalId: data.proposal_id as string,
    proposalNumber: data.proposal_number as string,
    proposalTotal: data.proposal_total as number,
    requestedBy: data.requested_by as string,
    requestedAt: data.requested_at as string,
    discountType: data.discount_type as 'percent' | 'fixed',
    discountValue: data.discount_value as number,
    discountAmount: data.discount_amount as number,
    discountPercentOfTotal: data.discount_percent_of_total as number,
    reason: data.reason as string,
    supportingNotes: data.supporting_notes as string | undefined,
    clientName: data.client_name as string | undefined,
    clientId: data.client_id as string | undefined,
    isRepeatCustomer: data.is_repeat_customer as boolean,
    clientLifetimeValue: data.client_lifetime_value as number | undefined,
    status: data.status as ApprovalStatus,
    reviewedBy: data.reviewed_by as string | undefined,
    reviewedAt: data.reviewed_at as string | undefined,
    reviewerNotes: data.reviewer_notes as string | undefined,
    counterDiscountType: data.counter_discount_type as 'percent' | 'fixed' | undefined,
    counterDiscountValue: data.counter_discount_value as number | undefined,
    escalated: data.escalated as boolean,
    escalatedAt: data.escalated_at as string | undefined,
    escalatedTo: data.escalated_to as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ============================================================================
// All services exported inline above with 'export const'
// ============================================================================
