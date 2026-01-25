/**
 * Sommer's Proposal System - Discount Components Exports
 * Complete export list for all discount-related components
 */

// ============================================================================
// MAIN DISCOUNT MANAGER
// ============================================================================
export {
  DiscountManager,
  SeasonalBanner,
  LoyaltyWidget,
  AppliedDiscountCard,
  AvailableDiscountCard,
  UpsellCard,
} from './DiscountManager';

// ============================================================================
// MODALS & FORMS
// ============================================================================
export { CreateDiscountCodeModal } from './CreateDiscountCodeModal';
export { BulkCodeGenerator } from './BulkCodeGenerator';
export { default as AutoRuleModal } from './AutoRuleModal';
export { default as SeasonalCampaignModal } from './SeasonalCampaignModal';
export { default as DiscountCodeModal } from './DiscountCodeModal';
export { default as VolumeDiscountEditor } from './VolumeDiscountEditor';

// ============================================================================
// AI & SMART FEATURES
// ============================================================================
export { AIDiscountSuggestions } from './AIDiscountSuggestions';
export type { DealContext, DiscountSuggestion } from './AIDiscountSuggestions';

// ============================================================================
// CUSTOMER HISTORY & TRACKING
// ============================================================================
export { CustomerDiscountHistory } from './CustomerDiscountHistory';

// ============================================================================
// FLOATING WIDGET
// ============================================================================
export { FloatingDiscountPreview } from './FloatingDiscountPreview';

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================
export { DiscountAnalyticsDashboard } from './DiscountAnalyticsDashboard';

// ============================================================================
// A/B TESTING
// ============================================================================
export { ABTestDashboard, abTestService } from './ABTestDashboard';
export type { ABTest, ABTestVariant, CreateABTestInput } from './ABTestDashboard';
