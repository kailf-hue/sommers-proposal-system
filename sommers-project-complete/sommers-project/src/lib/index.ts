/**
 * Sommer's Proposal System - Service Exports
 * Central export hub for all lib services
 */

// Core Services
export * from './supabase';
export * from './utils';

// Domain Services
export * from './ai';
export * from './analytics';
export * from './api';
export * from './audit';
export * from './auth';
export * from './branding';
export * from './clients';
export * from './discounts';
export * from './email';
export * from './gallery';
export * from './integrations';
export * from './inventory';
export * from './materials';
export * from './notifications';
export * from './payments';
export * from './pdf';
export * from './pipeline';
export * from './proposal';
export * from './reports';
export * from './scheduling';
export * from './templates';
export * from './video';
export * from './weather';
export * from './whitelabel';

// Types
export * from './database.types';

// ============================================================================
// SaaS Services (Phases 29-40)
// ============================================================================

// Phase 29: Entitlements & Feature Flags
export * from './entitlements/entitlementsService';

// Phase 30: Usage Tracking & Quotas
export * from './usage/usageService';

// Phase 31: Stripe Billing
export * from './billing/billingService';

// Phase 32: Provider Abstraction (AI/Weather)
export * from './providers/providersService';

// Phase 33-36: Industry Engine & Service Catalog
export * from './industries/industriesService';

// Phase 37-38: Block Registry & Editor
export * from './blocks/blocksService';

// Phase 39-40: Automation Engine
export * from './automation/automationService';

// Phase 41: CRM Dashboard
export * from './crm/crmDashboardService';

// Phase 42: Pipeline Forecasting
export * from './pipeline/pipelineForecastService';

// Phase 43: Advanced Analytics
export * from './analytics/advancedAnalyticsService';

// Phase 44: E-Signature
export * from './esignature/eSignatureService';

// Phase 45: White Label
export * from './whitelabel/whiteLabelService';

// Phase 46: Public API
export * from './api/publicApiService';

// Phase 47: Integrations Hub
export * from './integrations/integrationsHubService';

// Phase 48-49: AI Pricing Optimization
export * from './ai/aiPricingService';
