/**
 * Sommer's Proposal System - Discount System Exports
 * Central export point for all discount-related modules
 */

// ============================================================================
// TYPES
// ============================================================================
export * from './discountTypes';

// ============================================================================
// SERVICES
// ============================================================================
export {
  discountCodesService,
  autoDiscountService,
  loyaltyService,
  volumeDiscountService,
  seasonalDiscountService,
  discountApprovalService,
  discountEngine,
} from './discountService';

// ============================================================================
// HOOKS
// ============================================================================
export {
  useDiscounts,
  usePromoCode,
  useLoyalty,
  useDiscountApprovals,
  useAutoDiscountRules,
  useVolumeDiscounts,
  useSeasonalDiscounts,
} from './useDiscounts';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================
export {
  renderPromoCodeEmail,
  renderLoyaltyWelcomeEmail,
  renderTierUpgradeEmail,
  renderPointsEarnedEmail,
  renderSeasonalPromoEmail,
  renderApprovalRequestEmail,
  renderApprovalResultEmail,
  renderExpiringCodeEmail,
  sendPromoCodeEmail,
  sendLoyaltyWelcomeEmail,
  sendTierUpgradeEmail,
  sendApprovalRequestEmail,
  sendExpiringCodeEmail,
} from './discountEmailTemplates';

export type {
  DiscountEmailData,
  PromoCodeEmailData,
  LoyaltyWelcomeEmailData,
  LoyaltyTierUpgradeEmailData,
  PointsEarnedEmailData,
  SeasonalPromoEmailData,
  ApprovalRequestEmailData,
  ApprovalResultEmailData,
  ExpiringCodeEmailData,
} from './discountEmailTemplates';

// ============================================================================
// PDF INTEGRATION
// ============================================================================
export {
  PDFDiscountRenderer,
  generateProposalPDFWithDiscounts,
  addDiscountWatermark,
} from './pdfDiscountRenderer';

export type {
  ProposalPDFData,
  PDFDiscountOptions,
} from './pdfDiscountRenderer';
