/**
 * Sommer's Proposal System - Advanced Discount System Types
 * Covers all 6 discount features:
 * 1. Discount Codes (promo codes)
 * 2. Automatic Discounts (rule-based)
 * 3. Loyalty Discounts (repeat customers)
 * 4. Bulk/Volume Discounts (tiered)
 * 5. Seasonal Discounts (time-limited)
 * 6. Discount Approval Workflow
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type DiscountType = 'percent' | 'fixed';

export type DiscountSource =
  | 'manual'
  | 'promo_code'
  | 'automatic_rule'
  | 'loyalty'
  | 'volume'
  | 'seasonal'
  | 'referral';

export interface DiscountValue {
  type: DiscountType;
  value: number;
  maxAmount?: number; // Cap for percentage discounts
}

export interface AppliedDiscount {
  id: string;
  sourceType: DiscountSource;
  sourceId?: string;
  sourceName: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number; // Actual $ saved
  orderPosition: number;
  appliedToSubtotal: number;
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  approvalRequestId?: string;
  appliedAt: string;
  appliedBy?: string;
}

// ============================================================================
// 1. DISCOUNT CODES (PROMO CODES)
// ============================================================================

export interface DiscountCode {
  id: string;
  orgId: string;
  code: string;
  name: string;
  description?: string;
  
  // Discount
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  
  // Restrictions
  minOrderAmount: number;
  maxUsesTotal?: number;
  maxUsesPerCustomer: number;
  applicableServices?: string[];
  applicableTiers?: ('economy' | 'standard' | 'premium')[];
  newCustomersOnly: boolean;
  existingCustomersOnly: boolean;
  specificCustomerIds?: string[];
  
  // Validity
  startsAt: string;
  expiresAt?: string;
  isActive: boolean;
  
  // Tracking
  timesUsed: number;
  totalDiscountGiven: number;
  
  // Metadata
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCodeUsage {
  id: string;
  orgId: string;
  discountCodeId: string;
  proposalId?: string;
  clientId?: string;
  clientEmail?: string;
  orderAmount: number;
  discountAmount: number;
  appliedAt: string;
  appliedBy?: string;
}

export interface ValidateCodeResult {
  valid: boolean;
  error?: string;
  discountCodeId?: string;
  code?: string;
  name?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  description?: string;
}

export interface CreateDiscountCodeInput {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUsesTotal?: number;
  maxUsesPerCustomer?: number;
  applicableServices?: string[];
  applicableTiers?: string[];
  newCustomersOnly?: boolean;
  existingCustomersOnly?: boolean;
  specificCustomerIds?: string[];
  startsAt?: string;
  expiresAt?: string;
}

// ============================================================================
// 2. AUTOMATIC DISCOUNT RULES
// ============================================================================

export type AutoDiscountRuleType =
  | 'order_minimum'
  | 'service_quantity'
  | 'service_combo'
  | 'first_order'
  | 'repeat_customer'
  | 'referral'
  | 'seasonal'
  | 'day_of_week'
  | 'bulk_volume';

export interface AutoDiscountRule {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  priority: number;
  ruleType: AutoDiscountRuleType;
  conditions: AutoDiscountConditions;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  stackable: boolean;
  stackWithCodes: boolean;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  timesApplied: number;
  totalDiscountGiven: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type AutoDiscountConditions =
  | OrderMinimumCondition
  | ServiceQuantityCondition
  | ServiceComboCondition
  | FirstOrderCondition
  | RepeatCustomerCondition
  | ReferralCondition
  | SeasonalCondition
  | DayOfWeekCondition
  | BulkVolumeCondition;

export interface OrderMinimumCondition {
  type: 'order_minimum';
  minAmount: number;
}

export interface ServiceQuantityCondition {
  type: 'service_quantity';
  service: string;
  minQuantity: number;
  unit: 'sqft' | 'lf' | 'each';
}

export interface ServiceComboCondition {
  type: 'service_combo';
  requiredServices: string[];
  requireAll: boolean;
}

export interface FirstOrderCondition {
  type: 'first_order';
}

export interface RepeatCustomerCondition {
  type: 'repeat_customer';
  minOrders?: number;
}

export interface ReferralCondition {
  type: 'referral';
}

export interface SeasonalCondition {
  type: 'seasonal';
  startMonth: number; // 1-12
  endMonth: number;
  startDay?: number;
  endDay?: number;
}

export interface DayOfWeekCondition {
  type: 'day_of_week';
  days: number[]; // 0=Sun, 1=Mon, etc.
}

export interface BulkVolumeCondition {
  type: 'bulk_volume';
  measurementType: 'sqft' | 'amount';
  tiers: { min: number; max?: number; discountPercent: number }[];
}

export interface CreateAutoRuleInput {
  name: string;
  description?: string;
  priority?: number;
  ruleType: AutoDiscountRuleType;
  conditions: Record<string, unknown>;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  stackable?: boolean;
  stackWithCodes?: boolean;
  startsAt?: string;
  expiresAt?: string;
}

// ============================================================================
// 3. LOYALTY PROGRAM
// ============================================================================

export interface LoyaltyProgram {
  id: string;
  orgId: string;
  name: string;
  isActive: boolean;
  
  // Points earning
  pointsPerDollar: number;
  pointsForSignup: number;
  pointsForReferral: number;
  
  // Points redemption
  pointsToDollarRatio: number; // 0.01 = 100 points = $1
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
  
  // Tiers
  tiers: LoyaltyTier[];
  
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  discountPercent: number;
  perks: LoyaltyPerk[];
  badgeColor?: string;
  badgeIcon?: string;
}

export type LoyaltyPerk =
  | 'priority_scheduling'
  | 'free_inspection'
  | 'dedicated_rep'
  | 'extended_warranty'
  | 'free_touch_ups'
  | 'early_access';

export interface CustomerLoyalty {
  id: string;
  orgId: string;
  clientId: string;
  
  // Points
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentPoints: number;
  
  // Stats
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  
  // Tier
  currentTier: string;
  tierDiscountPercent: number;
  
  // Referral
  referredBy?: string;
  referralCode: string;
  referralsCount: number;
  
  enrolledAt: string;
  updatedAt: string;
}

export type LoyaltyTransactionType =
  | 'earn_purchase'
  | 'earn_signup'
  | 'earn_referral'
  | 'earn_bonus'
  | 'redeem'
  | 'expire'
  | 'adjust';

export interface LoyaltyTransaction {
  id: string;
  orgId: string;
  customerLoyaltyId: string;
  type: LoyaltyTransactionType;
  points: number; // Positive for earn, negative for redeem
  balanceAfter: number;
  proposalId?: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

export interface RedeemPointsInput {
  clientId: string;
  points: number;
  proposalId?: string;
}

export interface EarnPointsInput {
  clientId: string;
  orderAmount: number;
  proposalId?: string;
  bonusPoints?: number;
  bonusReason?: string;
}

// ============================================================================
// 4. VOLUME/BULK DISCOUNTS
// ============================================================================

export type VolumeMeasurementType =
  | 'total_sqft'
  | 'total_amount'
  | 'service_quantity'
  | 'annual_volume';

export interface VolumeDiscountTier {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  measurementType: VolumeMeasurementType;
  serviceType?: string;
  tiers: VolumeTierLevel[];
  stackable: boolean;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeTierLevel {
  min: number;
  max?: number | null;
  discountPercent: number;
  discountFixed: number;
  label?: string; // "Bronze", "Silver", etc.
}

export interface CalculateVolumeDiscountInput {
  measurementType: VolumeMeasurementType;
  value: number;
  serviceType?: string;
}

export interface VolumeDiscountResult {
  tierId: string;
  tierName: string;
  tierLevel: VolumeTierLevel;
  discountPercent: number;
  discountAmount: number;
  nextTier?: {
    level: VolumeTierLevel;
    amountToReach: number;
    additionalSavings: number;
  };
}

// ============================================================================
// 5. SEASONAL DISCOUNTS
// ============================================================================

export interface SeasonalDiscount {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  bannerText?: string;
  bannerColor: string;
  
  // Schedule
  startsAt: string;
  expiresAt: string;
  isRecurring: boolean;
  recurrenceType?: 'yearly' | 'monthly' | 'weekly';
  
  // Discount
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  
  // Restrictions
  minOrderAmount: number;
  applicableServices?: string[];
  
  // Marketing
  promoCode?: string;
  showCountdown: boolean;
  showBanner: boolean;
  
  // Status
  isActive: boolean;
  
  // Tracking
  views: number;
  timesApplied: number;
  totalDiscountGiven: number;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSeasonalDiscount extends SeasonalDiscount {
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  };
  isExpiringSoon: boolean; // < 48 hours
}

export interface CreateSeasonalDiscountInput {
  name: string;
  description?: string;
  bannerText?: string;
  bannerColor?: string;
  startsAt: string;
  expiresAt: string;
  isRecurring?: boolean;
  recurrenceType?: 'yearly' | 'monthly' | 'weekly';
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  applicableServices?: string[];
  promoCode?: string;
  showCountdown?: boolean;
  showBanner?: boolean;
}

// ============================================================================
// 6. DISCOUNT APPROVAL WORKFLOW
// ============================================================================

export interface DiscountApprovalSettings {
  id: string;
  orgId: string;
  requireApproval: boolean;
  
  // Thresholds
  approvalThresholdPercent: number;
  approvalThresholdAmount: number;
  approvalForOrdersOver?: number;
  
  // Role limits
  roleLimits: Record<string, RoleDiscountLimit>;
  
  // Approval chain
  defaultApprovers: string[];
  escalationAfterHours: number;
  autoRejectAfterHours: number;
  
  // Notifications
  notifyOnRequest: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface RoleDiscountLimit {
  maxPercent: number;
  maxAmount: number | null;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface DiscountApprovalRequest {
  id: string;
  orgId: string;
  
  // Proposal
  proposalId: string;
  proposalNumber: string;
  proposalTotal: number;
  
  // Requester
  requestedBy: string;
  requestedAt: string;
  
  // Discount
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  discountPercentOfTotal: number;
  
  // Justification
  reason: string;
  supportingNotes?: string;
  
  // Client context
  clientName?: string;
  clientId?: string;
  isRepeatCustomer: boolean;
  clientLifetimeValue?: number;
  
  // Status
  status: ApprovalStatus;
  
  // Review
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  
  // Counter-offer
  counterDiscountType?: DiscountType;
  counterDiscountValue?: number;
  
  // Escalation
  escalated: boolean;
  escalatedAt?: string;
  escalatedTo?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalRequestInput {
  proposalId: string;
  discountType: DiscountType;
  discountValue: number;
  reason: string;
  supportingNotes?: string;
}

export interface ReviewApprovalInput {
  requestId: string;
  action: 'approve' | 'reject' | 'counter';
  notes?: string;
  counterDiscountType?: DiscountType;
  counterDiscountValue?: number;
}

// ============================================================================
// DISCOUNT ENGINE TYPES
// ============================================================================

export interface DiscountContext {
  orgId: string;
  proposalId?: string;
  
  // Order details
  subtotal: number;
  services: ServiceForDiscount[];
  tier: 'economy' | 'standard' | 'premium';
  
  // Client
  clientId?: string;
  clientEmail?: string;
  isNewCustomer: boolean;
  clientTotalOrders?: number;
  clientLifetimeValue?: number;
  
  // Loyalty
  loyaltyPoints?: number;
  loyaltyTier?: string;
  
  // Manual inputs
  promoCode?: string;
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  
  // User
  userId: string;
  userRole: string;
}

export interface ServiceForDiscount {
  type: string;
  name: string;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface DiscountCalculationResult {
  // All applicable discounts
  availableDiscounts: AvailableDiscount[];
  
  // Applied discounts (in order)
  appliedDiscounts: AppliedDiscount[];
  
  // Totals
  originalSubtotal: number;
  totalDiscount: number;
  finalSubtotal: number;
  
  // Approval status
  requiresApproval: boolean;
  approvalReason?: string;
  
  // Upsell suggestions
  upsellSuggestions: DiscountUpsell[];
}

export interface AvailableDiscount {
  source: DiscountSource;
  sourceId: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  estimatedSavings: number;
  canApply: boolean;
  reason?: string; // Why can't apply
  stackable: boolean;
  priority: number;
}

export interface DiscountUpsell {
  type: 'volume' | 'combo' | 'loyalty' | 'seasonal';
  message: string;
  actionRequired: string;
  potentialSavings: number;
  ctaText: string;
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface DiscountManagerProps {
  context: DiscountContext;
  onDiscountsChange: (result: DiscountCalculationResult) => void;
  showApprovalWorkflow?: boolean;
  allowManualDiscounts?: boolean;
}

export interface PromoCodeInputProps {
  onApply: (code: string) => Promise<ValidateCodeResult>;
  appliedCode?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

export interface LoyaltyWidgetProps {
  clientId: string;
  onRedeemPoints?: (points: number) => void;
  showFullHistory?: boolean;
}

export interface SeasonalBannerProps {
  discount: ActiveSeasonalDiscount;
  onApply?: () => void;
  dismissable?: boolean;
}

export interface ApprovalRequestFormProps {
  proposalId: string;
  proposalTotal: number;
  currentDiscount: number;
  onSubmit: (request: CreateApprovalRequestInput) => Promise<void>;
  onCancel: () => void;
}

export interface ApprovalQueueProps {
  filter?: ApprovalStatus;
  onReview: (requestId: string) => void;
}
