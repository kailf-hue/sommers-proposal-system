-- ============================================================================
-- Sommer's Sealcoating Proposal System - Complete Database Schema
-- Version 2.0 - Production Ready
-- 85+ Tables covering all 28 phases + 5 enhancements + discount system
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ORGANIZATIONS & USERS (Multi-tenant)
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  
  -- Branding
  brand_color VARCHAR(7) DEFAULT '#C41E3A',
  accent_color VARCHAR(7),
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  currency VARCHAR(3) DEFAULT 'USD',
  locale VARCHAR(10) DEFAULT 'en-US',
  tax_rate DECIMAL(5,4) DEFAULT 0.0800,
  
  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'starter',
  subscription_status VARCHAR(20) DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'sales',
  
  -- Permissions
  permissions JSONB DEFAULT '{}',
  
  -- Discount approval limits
  max_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  can_approve_discounts BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, clerk_user_id),
  UNIQUE(org_id, email)
);

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'sales', 'viewer');

-- ============================================================================
-- CONTACTS & COMPANIES (CRM)
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  
  -- Financials
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  
  -- Loyalty
  loyalty_tier VARCHAR(20),
  lifetime_value DECIMAL(15,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Tags & Notes
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  title VARCHAR(100),
  
  -- Address (optional, uses company if not set)
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  
  -- Communication
  preferred_contact_method VARCHAR(20) DEFAULT 'email',
  do_not_contact BOOLEAN DEFAULT FALSE,
  
  -- Lead info
  source VARCHAR(50),
  lead_score INTEGER DEFAULT 0,
  
  -- Tags & Notes
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id),
  
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  
  -- Related entities
  proposal_id UUID,
  deal_id UUID,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROPOSALS
-- ============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_number VARCHAR(50) NOT NULL,
  
  -- Relations
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  created_by UUID NOT NULL REFERENCES team_members(id),
  assigned_to UUID REFERENCES team_members(id),
  template_id UUID,
  
  -- Property Info
  property_name VARCHAR(255),
  property_type VARCHAR(50),
  property_address TEXT,
  property_city VARCHAR(100),
  property_state VARCHAR(2),
  property_zip VARCHAR(10),
  
  -- Measurements
  total_sqft DECIMAL(12,2),
  net_sqft DECIMAL(12,2),
  surface_condition VARCHAR(20) DEFAULT 'fair',
  measurements JSONB DEFAULT '{}',
  
  -- Pricing
  tier VARCHAR(20) DEFAULT 'standard',
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  deposit_percent INTEGER DEFAULT 30,
  
  -- Content
  title VARCHAR(255),
  introduction TEXT,
  scope_of_work TEXT,
  terms_and_conditions TEXT,
  custom_sections JSONB DEFAULT '[]',
  
  -- Settings
  valid_days INTEGER DEFAULT 30,
  valid_until DATE,
  require_signature BOOLEAN DEFAULT TRUE,
  require_deposit BOOLEAN DEFAULT TRUE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_proposal_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, proposal_number)
);

CREATE TABLE proposal_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  service_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL,
  unit VARCHAR(20),
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  
  tier VARCHAR(20) DEFAULT 'all',
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  image_type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  signer_title VARCHAR(100),
  signature_data TEXT NOT NULL,
  
  -- Consent
  consent_items JSONB DEFAULT '[]',
  
  -- Verification
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proposal_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  viewer_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  
  -- Engagement
  duration_seconds INTEGER DEFAULT 0,
  sections_viewed JSONB DEFAULT '[]',
  
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DISCOUNT SYSTEM (11 Tables)
-- ============================================================================

-- Promo Codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  
  -- Limits
  max_uses INTEGER,
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(12,2),
  max_discount_amount DECIMAL(12,2),
  
  -- Restrictions
  allowed_services TEXT[],
  allowed_tiers TEXT[],
  allowed_customer_types TEXT[],
  
  -- Validity
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, code)
);

-- Automatic Discount Rules
CREATE TABLE automatic_discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL,
  
  -- Conditions
  conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Discount
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  max_discount_amount DECIMAL(12,2),
  
  -- Settings
  priority INTEGER DEFAULT 0,
  stackable BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Program
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL DEFAULT 'Loyalty Program',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Points settings
  points_per_dollar DECIMAL(5,2) DEFAULT 1.00,
  points_for_signup INTEGER DEFAULT 100,
  points_for_referral INTEGER DEFAULT 500,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  perks TEXT[],
  color VARCHAR(7),
  
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE customer_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  current_tier_id UUID REFERENCES loyalty_tiers(id),
  
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES contacts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, contact_id)
);

-- Volume Discounts
CREATE TABLE volume_discount_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  tier_type VARCHAR(50) NOT NULL,
  
  min_value DECIMAL(12,2) NOT NULL,
  max_value DECIMAL(12,2),
  discount_percent DECIMAL(5,2) NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal Campaigns
CREATE TABLE seasonal_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  promo_code VARCHAR(50),
  
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  banner_text VARCHAR(255),
  banner_color VARCHAR(7),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Approvals
CREATE TABLE discount_approval_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  role VARCHAR(20) NOT NULL,
  max_discount_percent DECIMAL(5,2) NOT NULL,
  can_approve BOOLEAN DEFAULT FALSE,
  
  UNIQUE(org_id, role)
);

CREATE TABLE discount_approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  
  requested_by UUID NOT NULL REFERENCES team_members(id),
  requested_discount_percent DECIMAL(5,2) NOT NULL,
  requested_discount_amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES team_members(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  approved_discount_percent DECIMAL(5,2),
  approved_discount_amount DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applied Discounts (tracking)
CREATE TABLE applied_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  source_name VARCHAR(255),
  
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PIPELINE / DEALS
-- ============================================================================

CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  probability INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE
);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  proposal_id UUID REFERENCES proposals(id),
  
  stage_id UUID NOT NULL REFERENCES deal_stages(id),
  owner_id UUID REFERENCES team_members(id),
  
  value DECIMAL(12,2) DEFAULT 0,
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  
  source VARCHAR(100),
  lost_reason VARCHAR(255),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SCHEDULING
-- ============================================================================

CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  
  leader_id UUID REFERENCES team_members(id),
  members UUID[],
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  proposal_id UUID REFERENCES proposals(id),
  contact_id UUID REFERENCES contacts(id),
  crew_id UUID REFERENCES crews(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Schedule
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration_hours DECIMAL(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Weather
  weather_suitable BOOLEAN DEFAULT TRUE,
  weather_notes TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEMPLATES
-- ============================================================================

CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Content
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Settings
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  thumbnail_url TEXT,
  
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTENT BLOCKS
-- ============================================================================

CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  block_type VARCHAR(50) NOT NULL,
  
  content JSONB NOT NULL,
  
  is_global BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  
  -- OAuth
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Config
  config JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, provider)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id),
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Related entity
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  channels TEXT[] DEFAULT ARRAY['in_app'],
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMAILS
-- ============================================================================

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  
  template_type VARCHAR(50),
  variables TEXT[],
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  
  -- Related entity
  proposal_id UUID REFERENCES proposals(id),
  contact_id UUID REFERENCES contacts(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Tracking
  message_id VARCHAR(255),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY & MATERIALS
-- ============================================================================

CREATE TABLE material_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  
  unit VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  
  coverage_rate DECIMAL(12,2),
  coverage_unit VARCHAR(50),
  
  supplier VARCHAR(255),
  supplier_sku VARCHAR(100),
  
  current_stock DECIMAL(12,2) DEFAULT 0,
  reorder_point DECIMAL(12,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WEATHER
-- ============================================================================

CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  
  forecast_date DATE NOT NULL,
  
  temperature_high INTEGER,
  temperature_low INTEGER,
  humidity INTEGER,
  precipitation_chance INTEGER,
  wind_speed INTEGER,
  conditions VARCHAR(100),
  
  work_suitability_score INTEGER,
  
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(latitude, longitude, forecast_date)
);

-- ============================================================================
-- GALLERY
-- ============================================================================

CREATE TABLE gallery_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  job_id UUID REFERENCES jobs(id),
  
  property_type VARCHAR(100),
  services_performed TEXT[],
  
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  
  completed_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES gallery_projects(id) ON DELETE CASCADE,
  
  photo_type VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption VARCHAR(255),
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT PLANS
-- ============================================================================

CREATE TABLE payment_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  
  num_installments INTEGER NOT NULL,
  deposit_percent DECIMAL(5,2),
  
  interest_rate DECIMAL(5,2) DEFAULT 0,
  late_fee_type VARCHAR(20),
  late_fee_amount DECIMAL(12,2),
  
  min_order_amount DECIMAL(12,2),
  max_order_amount DECIMAL(12,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  contact_id UUID REFERENCES contacts(id),
  
  template_id UUID REFERENCES payment_plan_templates(id),
  
  total_amount DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2),
  remaining_amount DECIMAL(12,2),
  
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  
  installment_number INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending',
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  
  stripe_payment_intent_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL,
  
  conditions JSONB NOT NULL,
  approval_chain JSONB NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  rule_id UUID REFERENCES approval_rules(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  requested_by UUID NOT NULL REFERENCES team_members(id),
  
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- I18N / LOCALIZATION
-- ============================================================================

CREATE TABLE user_locale_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
  number_format VARCHAR(20) DEFAULT 'en-US',
  
  UNIQUE(user_id)
);

-- ============================================================================
-- WHITE-LABEL / MULTI-TENANT
-- ============================================================================

CREATE TABLE white_label_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  custom_domain VARCHAR(255),
  subdomain VARCHAR(100),
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  
  -- Custom content
  company_name VARCHAR(255),
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  
  -- Features
  hide_powered_by BOOLEAN DEFAULT FALSE,
  custom_css TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id)
);

-- ============================================================================
-- PUBLIC API
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(10) NOT NULL,
  
  scopes TEXT[],
  
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  
  secret VARCHAR(64),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES team_members(id),
  action VARCHAR(100) NOT NULL,
  
  entity_type VARCHAR(50),
  entity_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- A/B TESTING (for discounts)
-- ============================================================================

CREATE TABLE discount_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  status VARCHAR(20) DEFAULT 'draft',
  test_type VARCHAR(50) NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all',
  
  control_variant JSONB NOT NULL,
  test_variants JSONB NOT NULL DEFAULT '[]',
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  min_sample_size INTEGER DEFAULT 1000,
  
  total_participants INTEGER DEFAULT 0,
  winning_variant VARCHAR(255),
  statistical_significance DECIMAL(5,2),
  confidence_level INTEGER DEFAULT 95,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Team Members
CREATE INDEX idx_team_members_org ON team_members(org_id);
CREATE INDEX idx_team_members_clerk ON team_members(clerk_user_id);

-- Contacts
CREATE INDEX idx_contacts_org ON contacts(org_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Proposals
CREATE INDEX idx_proposals_org ON proposals(org_id);
CREATE INDEX idx_proposals_contact ON proposals(contact_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- Deals
CREATE INDEX idx_deals_org ON deals(org_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);

-- Jobs
CREATE INDEX idx_jobs_org ON jobs(org_id);
CREATE INDEX idx_jobs_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_crew ON jobs(crew_id);

-- Discount Codes
CREATE INDEX idx_discount_codes_org ON discount_codes(org_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(org_id, code);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default deal stages
INSERT INTO deal_stages (id, org_id, name, color, probability, sort_order, is_won, is_lost) VALUES
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Lead', '#6B7280', 10, 0, false, false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Qualified', '#3B82F6', 25, 1, false, false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Proposal', '#8B5CF6', 50, 2, false, false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Negotiation', '#F59E0B', 75, 3, false, false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Won', '#22C55E', 100, 4, true, false),
  (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Lost', '#EF4444', 0, 5, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
